import { describe, expect, it } from 'vitest';

import {
  MAX_BRIDGE_VERTICES,
  parseOrgRoadRow,
  roadLabelOf,
  roadLinesForBridge,
  roadLinesOf,
  simplifyLine,
  summarizeOrgRoad,
  type OrgRoadRow,
  type RoadVertex,
} from './org-road';

/** The Ahvaz demo road's shape: one long ordered centreline. */
const MULTILINE = {
  type: 'MultiLineString' as const,
  coordinates: [
    [
      [48.67056, 31.31823],
      [48.67156, 31.31923],
      [48.67256, 31.32023],
    ],
  ],
};

const row = (overrides: Partial<OrgRoadRow> = {}): OrgRoadRow => ({
  organization_id: 'org-1',
  road_id: 'road-1',
  name: 'آزادراه اهواز – بندر امام',
  payload_json: JSON.stringify({
    _id: 'road-1',
    name: 'آزادراه اهواز – بندر امام',
    area: MULTILINE,
    origin: 'اهواز',
    destination: 'بندر امام',
    total_length_meters: 116342,
  }),
  fetched_at: '2026-10-17T08:00:00.000Z',
  ...overrides,
});

/**
 * The real `organization.get` response for the Ahvaz–Bandar Imam organization, captured
 * from a running backend. 91 vertices, one ordered centreline, `[lng, lat]`.
 *
 * A hand-written fixture would have been written from the same assumption the code makes,
 * so it could not catch an inverted coordinate order — the one mistake that puts an
 * officer's road in the wrong hemisphere. This one is what the server actually sent.
 */
const AHVAZ_AREA = {"type":"MultiLineString","coordinates":[[[48.67056,31.31823],[48.66953,31.31866],[48.67089,31.321],[48.67816,31.31907],[48.67859,31.3211],[48.67978,31.32329],[48.68938,31.33032],[48.68978,31.33024],[48.69315,31.32864],[48.6947,31.32701],[48.69535,31.32743],[48.69552,31.32814],[48.69613,31.3283],[48.70057,31.32595],[48.70201,31.32568],[48.70719,31.32112],[48.71052,31.31647],[48.71984,31.31016],[48.72028,31.3088],[48.72545,31.30573],[48.73275,31.30282],[48.74155,31.29994],[48.74406,31.2996],[48.7461,31.30031],[48.75337,31.30663],[48.75441,31.30669],[48.77486,31.2938],[48.7848,31.2862],[48.79152,31.27608],[48.80072,31.25172],[48.80533,31.24252],[48.82418,31.21686],[48.85085,31.18505],[48.86197,31.16792],[48.86775,31.15589],[48.8702,31.15178],[48.88557,31.1324],[48.90776,31.09504],[48.91774,31.08026],[48.92182,31.07324],[48.93797,31.03705],[48.94133,31.03093],[48.94987,31.01758],[48.96223,30.99344],[48.96434,30.98994],[48.98974,30.95444],[48.99391,30.94753],[48.999,30.93676],[49.01674,30.91258],[49.03727,30.87616],[49.0414,30.86549],[49.048,30.84025],[49.06006,30.80235],[49.06173,30.79408],[49.06564,30.76601],[49.07625,30.72632],[49.07731,30.72012],[49.07619,30.69482],[49.08014,30.64605],[49.07964,30.63642],[49.07716,30.61399],[49.07731,30.60291],[49.08107,30.57795],[49.08326,30.57101],[49.08714,30.56292],[49.08806,30.55805],[49.0874,30.55301],[49.08137,30.53718],[49.0803,30.53552],[49.07712,30.53383],[49.07604,30.53288],[49.07479,30.53021],[49.07475,30.52747],[49.07354,30.52701],[49.07641,30.52135],[49.0752,30.50933],[49.07881,30.49682],[49.07812,30.49438],[49.07271,30.48745],[49.07227,30.4853],[49.07942,30.46826],[49.07979,30.46661],[49.07936,30.45898],[49.07602,30.44999],[49.07657,30.44414],[49.07607,30.44267],[49.07477,30.44141],[49.07683,30.44105],[49.07675,30.43898],[49.07555,30.43894],[49.07542,30.43597]]]}
;

describe('parseOrgRoadRow', () => {
  it('reads a stored road back with its geometry', () => {
    const entry = parseOrgRoadRow(row());

    expect(entry).toMatchObject({
      organizationId: 'org-1',
      roadId: 'road-1',
      name: 'آزادراه اهواز – بندر امام',
      origin: 'اهواز',
      destination: 'بندر امام',
    });
    expect(roadLinesOf(entry)).toHaveLength(1);
  });

  it('treats a road with no geometry as nothing to draw, not as an error', () => {
    // Every production road looks like this until `area` is backfilled. It must
    // degrade to "no overlay" rather than crash the picker or claim a road it cannot
    // draw.
    const entry = parseOrgRoadRow(
      row({ payload_json: JSON.stringify({ _id: 'road-1', name: 'جاده گلف' }) }),
    );

    expect(entry).not.toBeNull();
    expect(roadLinesOf(entry)).toEqual([]);
  });

  it('drops a row with no key, which can never be looked up again', () => {
    expect(parseOrgRoadRow(row({ organization_id: '' }))).toBeNull();
  });

  it('drops a corrupt payload instead of poisoning the map', () => {
    expect(parseOrgRoadRow(row({ payload_json: '{not json' }))).toBeNull();
    expect(parseOrgRoadRow(row({ payload_json: '[1,2]' }))).toBeNull();
  });

  it('skips malformed vertices rather than drawing a line into nowhere', () => {
    const entry = parseOrgRoadRow(
      row({
        payload_json: JSON.stringify({
          _id: 'road-1',
          name: 'r',
          area: { type: 'MultiLineString', coordinates: [[['a', 1]], [[1, 2], [3, 4]]] },
        }),
      }),
    );

    // The bad pair is dropped; the good line still renders.
    expect(roadLinesOf(entry)).toEqual([[[1, 2], [3, 4]]]);
  });

  it('drops a line with fewer than two vertices, which cannot be drawn', () => {
    const entry = parseOrgRoadRow(
      row({
        payload_json: JSON.stringify({
          _id: 'road-1',
          name: 'r',
          area: { type: 'MultiLineString', coordinates: [[[1, 2]], [[3, 4], [5, 6]]] },
        }),
      }),
    );

    expect(roadLinesOf(entry)).toEqual([[[3, 4], [5, 6]]]);
  });
});

describe('simplifyLine', () => {
  it('keeps every vertex of a road short enough to need no reduction', () => {
    const line: RoadVertex[] = Array.from({ length: 50 }, (_, index) => [48 + index / 1000, 31]);

    expect(simplifyLine(line)).toHaveLength(50);
  });

  it('cuts a very long road down, and always keeps its two ends', () => {
    // A 116 km road is tens of thousands of vertices. Shipping that as JSON across the
    // WebView bridge on every map load is the reason this cap exists.
    const line: RoadVertex[] = Array.from({ length: 20_000 }, (_, index) => [48 + index / 100_000, 31]);
    const reduced = simplifyLine(line);

    expect(reduced.length).toBeLessThanOrEqual(MAX_BRIDGE_VERTICES);
    expect(reduced[0]).toEqual(line[0]);
    expect(reduced[reduced.length - 1]).toEqual(line[line.length - 1]);
  });

  it('leaves the shape recognisable, not just the endpoints', () => {
    const line: RoadVertex[] = Array.from({ length: 1000 }, (_, index) => [48, 31 + index / 100_000]);
    const reduced = simplifyLine(line);

    // A middle vertex must survive, or the overlay draws two disconnected dots.
    expect(reduced.length).toBeGreaterThan(2);
    expect(reduced.some(vertex => vertex[1] > 31.002 && vertex[1] < 31.008)).toBe(true);
  });

  it('refuses to reduce below two points, whatever the cap', () => {
    const line: RoadVertex[] = Array.from({ length: 400 }, (_, index) => [48, 31 + index / 1000]);

    expect(simplifyLine(line, 1)).toHaveLength(2);
  });
});

describe('summarizeOrgRoad', () => {
  it('says plainly that no road is stored', () => {
    expect(summarizeOrgRoad(null, Date.parse('2026-10-17T12:00:00.000Z'))).toBe(
      'راه سازمان برای نقشه آفلاین ذخیره نشده',
    );
  });

  it('names the road, so the officer knows which one they have', () => {
    const entry = parseOrgRoadRow(row());

    expect(summarizeOrgRoad(entry, Date.parse('2026-10-17T12:00:00.000Z'))).toContain(
      'آزادراه اهواز – بندر امام',
    );
  });

  it('never claims a road it cannot draw', () => {
    // The stored road has no geometry — every production road, today. Saying the name
    // would tell the officer the map is covered when it is not.
    const entry = parseOrgRoadRow(
      row({ payload_json: JSON.stringify({ _id: 'road-1', name: 'جاده گلف' }) }),
    );

    expect(summarizeOrgRoad(entry, Date.parse('2026-10-17T12:00:00.000Z'))).toBe(
      'راه سازمان برای نقشه آفلاین ذخیره نشده',
    );
  });

  it('says how long ago the road was stored', () => {
    const entry = parseOrgRoadRow(row());

    expect(summarizeOrgRoad(entry, Date.parse('2026-10-17T12:00:00.000Z'))).toContain('۴ ساعت پیش');
  });
});

describe('the captured production response', () => {
  const entry = parseOrgRoadRow(
    row({
      payload_json: JSON.stringify({
        _id: '6ace2ee60f814f9bd681a766',
        name: 'آزادراه اهواز – بندر امام',
        area: AHVAZ_AREA,
      }),
    }),
  );

  it('yields the one centreline the server sent', () => {
    const lines = roadLinesOf(entry);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveLength(91);
  });

  it('starts at the organization centre, which is also its first vertex', () => {
    // `organization.location` is [48.67056, 31.31823] and the road's first vertex is the
    // same pair. If the parse reordered them, the overlay would start somewhere else
    // entirely — hundreds of kilometres away, with nothing on screen to explain it.
    expect(roadLinesOf(entry)[0][0]).toEqual([48.67056, 31.31823]);
  });

  it('spans the corridor rather than sitting on one point', () => {
    const points = roadLinesOf(entry)[0];

    expect(Math.min(...points.map(point => point[0]))).toBeLessThan(48.7);
    expect(Math.max(...points.map(point => point[0]))).toBeGreaterThan(49.0);
  });

  it('needs no thinning, so every vertex reaches the bridge', () => {
    // The 2,000-vertex cap exists for roads longer than this one. Asserting the shape
    // of the real data keeps that cap honest rather than theoretical.
    expect(roadLinesForBridge(entry)[0]).toHaveLength(91);
  });

  it('reports a stored road for the card, because this one is drawable', () => {
    expect(summarizeOrgRoad(entry, Date.parse('2026-10-17T12:00:00.000Z'))).not.toBe(
      'راه سازمان برای نقشه آفلاین ذخیره نشده',
    );
  });
});

describe('roadLabelOf', () => {
  it('carries the name through untouched, so the document owns the layout', () => {
    // Pre-formatting here would bake "name" into a string that also holds the endpoints
    // and the length, and the document could no longer lay them out as two lines.
    const road = parseOrgRoadRow(
      row({
        payload_json: JSON.stringify({
          _id: 'road-1',
          name: 'آزادراه اهواز – بندر امام',
          area: MULTILINE,
          origin: 'اهواز',
          destination: 'بندر امام',
          total_length_meters: 116342,
        }),
      }),
    );

    expect(roadLabelOf(road)).toEqual({
      name: 'آزادراه اهواز – بندر امام',
      origin: 'اهواز',
      destination: 'بندر امام',
      totalLengthMeters: 116342,
    });
  });

  it('labels nothing when the road has no geometry to label', () => {
    const road = parseOrgRoadRow(
      row({ payload_json: JSON.stringify({ _id: 'road-1', name: 'جاده گلف' }) }),
    );

    expect(roadLabelOf(road)).toBeNull();
  });

  it('still labels a road whose document carries no name, using the stored one', () => {
    // `name` is NOT NULL in the table and `parseOrgRoadRow` falls back to it, so "no
    // name anywhere" is not a reachable state — a road the officer patrols is always
    // nameable. Asserted so the fallback is a decision rather than an accident.
    const road = parseOrgRoadRow(
      row({ name: 'آزادراه اهواز – بندر امام', payload_json: JSON.stringify({ _id: 'road-1', area: MULTILINE }) }),
    );

    expect(roadLabelOf(road)).toMatchObject({ name: 'آزادراه اهواز – بندر امام' });
  });
});
