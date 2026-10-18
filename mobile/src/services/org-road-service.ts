/**
 * The organization's own road, fetched once and drawn from local storage.
 *
 * The map needs the road before an officer reaches the location picker, so it is
 * downloaded by the same button that fetches the organization's forms and read from
 * SQLite by the map. Nothing on the map path touches the network — an officer who is
 * out of coverage still sees the road, which is the whole point of storing it.
 */

import { fetchOrgRoad } from '@/api/organization';
import { roadLinesOf, type OrgRoad } from '@/domain/org-road';
import { snapToOrgRoad } from '@/domain/road-snap';
import type { Coordinates, PatrolOrganization, RoadSnap, Session } from '@/domain/types';
import { getOrgRoadGeometry, saveOrgRoadGeometry } from '@/storage/local-database';

export type OrgRoadDownload =
  /** The road was fetched and stored. */
  | { status: 'stored'; road: OrgRoad }
  /** This organization is not bound to a road. A normal answer, not a failure. */
  | { status: 'none' };

/** The stored road for an organization, or `null` when it was never downloaded. */
export async function loadCachedOrgRoad(organizationId: string): Promise<OrgRoad | null> {
  const row = await getOrgRoadGeometry(organizationId);
  return row ?? null;
}

/**
 * Fetch and store the organization's road.
 *
 * A throw here is the caller's problem on purpose: a transport failure must not be
 * mistaken for "this organization has no road", because the two lead to opposite
 * actions — one is worth retrying, the other is not worth drawing. The stored road is
 * left untouched either way, so a failed refresh cannot blank a map an officer already
 * had.
 */
export async function downloadOrgRoad(
  session: Session,
  organization: PatrolOrganization,
): Promise<OrgRoadDownload> {
  const result = await fetchOrgRoad(session, organization._id);
  const road = result?.road ?? null;
  if (!road) {
    return { status: 'none' };
  }
  const entry: OrgRoad = {
    organizationId: organization._id,
    roadId: String(road._id),
    name: road.name || organization.name,
    origin: road.origin,
    destination: road.destination,
    totalLengthMeters: road.total_length_meters,
    payload: road,
    fetchedAt: new Date().toISOString(),
  };
  await saveOrgRoadGeometry(entry);
  return { status: 'stored', road: entry };
}

/**
 * Whether the stored road is worth handing to the map.
 *
 * A row exists for every road the organization has, but only a road with geometry can
 * be drawn — and today that is the demo road alone. Kept next to the reader so a caller
 * cannot accidentally paint an empty overlay and wonder why nothing appeared.
 */
export function hasDrawableRoad(road: OrgRoad | null): boolean {
  return roadLinesOf(road).length > 0;
}

/**
 * Snap a point to the organization's own road using only local storage.
 *
 * The location picker's offline answer to `road.snapPointToRoad`: the road is read
 * from SQLite and projected with the backend's own method, so an officer out of
 * coverage still gets the road, kilometre/meter and direction the server would
 * have returned. `null` when nothing is stored or the road has no geometry, which
 * keeps the picker's honest «اطلاعات راه پس از اتصال تکمیل میشود» notice.
 */
export async function snapToCachedOrgRoad(
  organizationId: string,
  coords: Coordinates,
): Promise<RoadSnap | null> {
  const road = await loadCachedOrgRoad(organizationId);
  return snapToOrgRoad(coords, road);
}