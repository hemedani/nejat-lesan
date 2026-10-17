/**
 * The organization's own road, as the device stores and draws it.
 *
 * An officer picking a location wants to see the road they patrol, not just raster
 * tiles that show the motorway the same grey as every other road on the map. The
 * backend binds a freeway organization to exactly one road (`organization.road`, a 1:1
 * relation), and that road's `area` — an ordered `MultiLineString` centreline — is what
 * gets drawn over the tiles.
 *
 * Everything here is pure, and that is not a style preference. `expo-sqlite` cannot run
 * under vitest, and the geometry has to be defensible before it reaches a canvas: a road
 * with no geometry is the normal case today (see `back/prompt/07-…`), not an error, and
 * it must degrade to "no overlay" rather than crash the picker or draw a line into
 * nowhere.
 */

/** `[longitude, latitude]`, in the order the backend stores it. */
export type RoadVertex = [number, number];

/**
 * A road's `area`: an ordered centreline, one array of vertices per line.
 *
 * "Ordered" is load-bearing on the server — linear referencing walks it to turn a point
 * into a kilometre and a metre — so the line is kept in order here too.
 */
export type RoadGeometry = {
  type: 'MultiLineString';
  coordinates: RoadVertex[][];
};

export type OrgRoad = {
  organizationId: string;
  roadId: string;
  name: string;
  origin?: string;
  destination?: string;
  totalLengthMeters?: number;
  /** The stored road document, geometry included. */
  payload: unknown;
  fetchedAt: string;
};

/** The raw column values, as SQLite hands them back. */
export type OrgRoadRow = {
  organization_id: string;
  road_id: string;
  name: string;
  payload_json: string;
  fetched_at: string;
};

/**
 * How many vertices may cross the WebView bridge for one road.
 *
 * The demo road is 116 km. At a useful vertex spacing that is tens of thousands of
 * points, and it would be re-sent as JSON on every map load — over a boundary that
 * copies the string. At the app's maximum zoom (19) a few thousand points are visually
 * identical, so the cap costs nothing an officer can see.
 */
export const MAX_BRIDGE_VERTICES = 2000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isVertex(value: unknown): value is RoadVertex {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1])
  );
}

/**
 * Resolve a stored row, or `null` when it cannot be trusted.
 *
 * Null beats a throw: a corrupt row must degrade to "no road stored" so the officer
 * still gets the picker and the standard flow, rather than a screen that failed while
 * trying to draw a decoration.
 */
export function parseOrgRoadRow(row: OrgRoadRow): OrgRoad | null {
  if (row.organization_id.length === 0) {
    return null;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return null;
  }
  const document = payload as Record<string, unknown>;
  return {
    organizationId: row.organization_id,
    roadId: String(document['_id'] ?? row.road_id),
    name: typeof document['name'] === 'string' ? document['name'] : row.name,
    origin: typeof document['origin'] === 'string' ? document['origin'] : undefined,
    destination:
      typeof document['destination'] === 'string' ? document['destination'] : undefined,
    totalLengthMeters: isFiniteNumber(document['total_length_meters'])
      ? (document['total_length_meters'] as number)
      : undefined,
    payload,
    fetchedAt: row.fetched_at,
  };
}

/**
 * The drawable centrelines of a road.
 *
 * Empty for a road with no `area`, which is what every production road looks like until
 * the geometry is backfilled. Individual malformed vertices are dropped rather than
 * failing the whole road: one bad pair in a ten-thousand-vertex line should cost one
 * segment, not the officer's map.
 */
export function roadLinesOf(road: OrgRoad | null | undefined): RoadVertex[][] {
  const area = (road?.payload as { area?: { coordinates?: unknown } } | undefined)?.area;
  const coordinates = area?.coordinates;
  if (!Array.isArray(coordinates)) {
    return [];
  }
  return coordinates
    .map(line => (Array.isArray(line) ? line.filter(isVertex) : []))
    .filter(line => line.length >= 2);
}

/**
 * Thin a line down to at most `max` vertices, always keeping both ends.
 *
 * A stride rather than Douglas-Peucker: the goal is to bound the payload crossing the
 * bridge, not to model the road faithfully, and a stride needs no lookahead. Both ends
 * are kept so the road still reaches the edges of the drawn area instead of stopping
 * short of them.
 */
export function simplifyLine(
  line: readonly RoadVertex[],
  max: number = MAX_BRIDGE_VERTICES,
): RoadVertex[] {
  if (line.length <= max) {
    return [...line];
  }
  const floor = Math.max(2, Math.floor(max));
  const stride = Math.ceil(line.length / (floor - 1));
  const reduced: RoadVertex[] = [];
  for (let index = 0; index < line.length; index += stride) {
    reduced.push(line[index]);
  }
  const last = line[line.length - 1];
  if (reduced[reduced.length - 1] !== last) {
    reduced.push(last);
  }
  return reduced;
}

/**
 * What the map writes on the road.
 *
 * Sent alongside the lines rather than baked into them, because the document must not
 * need a request to learn a road's name — it is the one piece of the overlay that turns
 * a line into something an officer can read.
 */
export type RoadLabel = {
  name: string;
  /** The two ends, when the server knows them. */
  origin?: string;
  destination?: string;
  totalLengthMeters?: number;
};

/** Every line of a road, thinned for the bridge. */
export function roadLinesForBridge(road: OrgRoad | null | undefined): RoadVertex[][] {
  return roadLinesOf(road).map(line => simplifyLine(line));
}

/**
 * What to write on a road, or `null` when there is nothing worth saying.
 *
 * `null` for a road with no name: the line still draws, but an empty label is a blank
 * gap in the map. The fields are passed through raw rather than pre-formatted — the
 * document lays them out as two lines and converts the length to Persian digits, so the
 * composition lives with the drawing that consumes it.
 */
export function roadLabelOf(road: OrgRoad | null | undefined): RoadLabel | null {
  if (!road || roadLinesOf(road).length === 0 || road.name.length === 0) {
    return null;
  }
  return {
    name: road.name,
    origin: road.origin,
    destination: road.destination,
    totalLengthMeters: road.totalLengthMeters,
  };
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function fa(value: number): string {
  return Math.round(value).toLocaleString('fa-IR');
}

function describeAge(fetchedAt: string, nowMs: number): string | null {
  const then = Date.parse(fetchedAt);
  if (!Number.isFinite(then)) {
    return null;
  }
  const age = nowMs - then;
  if (age < MINUTE_MS) return 'همین حالا';
  if (age < HOUR_MS) return `${fa(age / MINUTE_MS)} دقیقه پیش`;
  if (age < DAY_MS) return `${fa(age / HOUR_MS)} ساعت پیش`;
  return `${fa(age / DAY_MS)} روز پیش`;
}

/**
 * The one line under the organization card that says whether the map will show a road.
 *
 * A stored road with no geometry is reported as nothing stored, even though a row
 * exists. Claiming the road would tell the officer the map is covered when there is
 * nothing to draw — which is precisely the state every organization is in today.
 */
export function summarizeOrgRoad(road: OrgRoad | null, nowMs: number): string {
  if (!road || roadLinesOf(road).length === 0) {
    return 'راه سازمان برای نقشه آفلاین ذخیره نشده';
  }
  const age = describeAge(road.fetchedAt, nowMs);
  const stored = `${road.name} ذخیره شد`;
  return age ? `${stored} · ${age}` : stored;
}