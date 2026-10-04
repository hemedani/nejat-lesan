import type { SnapPointResponse } from '@/api/road';
import type { RoadSnap } from './types';

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
