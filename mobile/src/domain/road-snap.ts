import type { SnapPointResponse } from '@/api/road';
import { roadLinesOf, type OrgRoad } from './org-road';
import { projectPointToMultiLine } from './road-projection';
import type { Coordinates, RoadSnap } from './types';

/**
 * Maps a `road.snapPointToRoad` response onto the `RoadSnap` the app persists on
 * a draft.
 *
 * Shared by the location picker (snapping while the officer moves the pin) and
 * the sync worker (completing a snap that was skipped because the pin was
 * confirmed offline) — one mapping, so the two can never drift.
 */
export function toRoadSnap(response: SnapPointResponse): RoadSnap {
  return {
    distance_to_road_meters: response.distanceToRoadMeters,
    direction: response.direction,
    from_origin_meters: response.fromOriginMeters,
    kilometer: response.kilometer,
    lanes: response.lanes,
    meter: response.meter,
    nearest_point: {
      latitude: response.nearestPoint.coordinates[1],
      longitude: response.nearestPoint.coordinates[0],
    },
    road_id: response.road._id,
    road_name: response.road.name,
    total_length_meters: response.totalLengthMeters,
  };
}

/**
 * Snap a point to the organization's own road, from the geometry already on the
 * device.
 *
 * The backend's `road.snapPointToRoad` needs the network and the `token` header;
 * the location picker needs to answer the same question with no signal, and the
 * centreline it would query is already stored in `org_road_geometry`. The
 * projection is the backend's own method (`road-projection.ts`), so a snap taken
 * offline and one taken online agree kilometre for kilometre and the server
 * accepts the resulting `roadId`/`kilometer`/`meter` unchanged.
 *
 * `null` for a road with no geometry — the normal case until the production
 * centrelines are backfilled — so the picker keeps its honest offline notice
 * instead of inventing a road reference.
 */
export function snapToOrgRoad(
  coords: Coordinates,
  road: OrgRoad | null | undefined,
): RoadSnap | null {
  const lines = roadLinesOf(road);
  if (!road || lines.length === 0) {
    return null;
  }
  const projection = projectPointToMultiLine(lines, [coords.longitude, coords.latitude]);
  const payload = road.payload as { lanes?: unknown } | null;
  const lanes = payload && Array.isArray(payload.lanes) ? payload.lanes : [];
  return {
    distance_to_road_meters: Math.round(projection.perpMeters),
    direction: road.origin && road.destination ? `${road.origin} - ${road.destination}` : null,
    from_origin_meters: Math.round(projection.alongMeters),
    kilometer: Math.floor(projection.alongMeters / 1000),
    lanes,
    meter: Math.round(projection.alongMeters % 1000),
    nearest_point: {
      latitude: projection.nearest[1],
      longitude: projection.nearest[0],
    },
    road_id: road.roadId,
    road_name: road.name,
    total_length_meters: road.totalLengthMeters ?? Math.round(projection.totalLengthMeters),
  };
}
