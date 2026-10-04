import { describe, expect, it } from 'vitest';

import type { SnapPointResponse } from '@/api/road';
import { toRoadSnap } from './road-snap';

const RESPONSE: SnapPointResponse = {
  direction: 'north',
  distanceToRoadMeters: 12.5,
  fromOriginMeters: 42_350,
  kilometer: 42,
  lanes: [{ _id: 'lane-1' }],
  nearestPoint: { coordinates: [51.4, 35.7], type: 'Point' },
  road: { _id: 'road-9', name: 'بزرگراه شهید همت' },
  meter: 350,
  totalLengthMeters: 100_000,
};

describe('toRoadSnap', () => {
  it('maps the road service response onto the persisted road snap', () => {
    expect(toRoadSnap(RESPONSE)).toEqual({
      direction: 'north',
      distance_to_road_meters: 12.5,
      from_origin_meters: 42_350,
      kilometer: 42,
      lanes: [{ _id: 'lane-1' }],
      meter: 350,
      nearest_point: { latitude: 35.7, longitude: 51.4 },
      road_id: 'road-9',
      road_name: 'بزرگراه شهید همت',
      total_length_meters: 100_000,
    });
  });

  it('turns the GeoJSON lng/lat pair into named coordinates', () => {
    // The service speaks GeoJSON ([longitude, latitude]); everything the app
    // persists speaks `{ latitude, longitude }`. Swapping them would send a road
    // reference for a point in the wrong hemisphere.
    const snap = toRoadSnap(RESPONSE);
    expect(snap.nearest_point?.latitude).toBe(35.7);
    expect(snap.nearest_point?.longitude).toBe(51.4);
  });

  it('keeps a null direction null so the mapper can skip it', () => {
    expect(toRoadSnap({ ...RESPONSE, direction: null }).direction).toBeNull();
  });
});
