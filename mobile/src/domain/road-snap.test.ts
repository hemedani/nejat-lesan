import { describe, expect, it } from 'vitest';

import type { SnapPointResponse } from '@/api/road';
import type { OrgRoad } from './org-road';
import { snapToOrgRoad, toRoadSnap } from './road-snap';

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

/**
 * The geometry is the same 111.32 m segment the projection tests use, so the
 * numbers the local snap produces can be checked by hand against the backend's
 * formula: halfway along is 55.66 m, and the point sits 110.574 m above the line.
 */
const ROAD: OrgRoad = {
  organizationId: 'org-1',
  roadId: 'road-9',
  name: 'بزرگراه شهید همت',
  origin: 'تهران',
  destination: 'قم',
  totalLengthMeters: 100_000,
  payload: {
    _id: 'road-9',
    name: 'بزرگراه شهید همت',
    area: { type: 'MultiLineString', coordinates: [[[0, 0], [0.001, 0]]] },
    lanes: [{ _id: 'lane-1' }],
  },
  fetchedAt: '2026-10-18T00:00:00.000Z',
};

describe('snapToOrgRoad', () => {
  it('computes the road reference from the stored centreline with no network', () => {
    const snap = snapToOrgRoad({ latitude: 0.001, longitude: 0.0005 }, ROAD);

    expect(snap).toMatchObject({
      road_id: 'road-9',
      road_name: 'بزرگراه شهید همت',
      direction: 'تهران - قم',
      kilometer: 0,
      meter: 56,
      distance_to_road_meters: 111,
      total_length_meters: 100_000,
      nearest_point: { latitude: 0, longitude: 0.0005 },
      lanes: [{ _id: 'lane-1' }],
    });
  });

  it('falls back to the geometry length when the road carries none', () => {
    const snap = snapToOrgRoad(
      { latitude: 0.001, longitude: 0.0005 },
      { ...ROAD, totalLengthMeters: undefined },
    );

    expect(snap?.total_length_meters).toBe(111);
  });

  it('leaves the direction null when the road has no endpoints', () => {
    const snap = snapToOrgRoad(
      { latitude: 0.001, longitude: 0.0005 },
      { ...ROAD, origin: undefined, destination: undefined },
    );

    expect(snap?.direction).toBeNull();
  });

  it('returns null for a road with no drawable geometry', () => {
    // Every production road looks like this until the geometry is backfilled; the
    // picker must fall back to the "no road offline" notice, not fabricate a snap.
    expect(snapToOrgRoad({ latitude: 0.001, longitude: 0.0005 }, null)).toBeNull();
    expect(
      snapToOrgRoad(
        { latitude: 0.001, longitude: 0.0005 },
        { ...ROAD, payload: { _id: 'road-9', name: 'جاده گلف' } },
      ),
    ).toBeNull();
  });
});
