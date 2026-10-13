import { describe, expect, it } from 'vitest';

import type { PatrolOrganization } from './types';
import {
  DEFAULT_INCIDENT_ZOOM,
  formatCoordinates,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  organizationPoint,
  organizationZoom,
} from './organization';

function org(overrides: Partial<PatrolOrganization> = {}): PatrolOrganization {
  return {
    _id: 'o1',
    code: 'AHR',
    name: 'شرکت ره',
    ...overrides,
  };
}

const ahvaz = { type: 'Point' as const, coordinates: [48.67056, 31.31823] as [number, number] };

describe('organizationPoint', () => {
  it('swaps GeoJSON [lng, lat] into Coordinates [lat, lng]', () => {
    // A missed swap would put the Ahvaz centre in the Indian Ocean.
    expect(organizationPoint(org({ location: ahvaz }))).toEqual({
      latitude: 31.31823,
      longitude: 48.67056,
    });
  });

  it('returns null when there is no organization at all', () => {
    expect(organizationPoint(null)).toBeNull();
    expect(organizationPoint(undefined)).toBeNull();
  });

  it('returns null when the organization carries no point', () => {
    expect(organizationPoint(org())).toBeNull();
  });

  it('returns null for a non-Point geometry', () => {
    expect(
      organizationPoint(
        org({ location: { type: 'Polygon', coordinates: [48.6, 31.3] } as never }),
      ),
    ).toBeNull();
  });

  it('returns null for a malformed coordinate pair', () => {
    expect(organizationPoint(org({ location: { type: 'Point', coordinates: [48.6] as never } }))).toBeNull();
    expect(
      organizationPoint(org({ location: { type: 'Point', coordinates: [48.6, 31.3, 12] as never } })),
    ).toBeNull();
  });

  it('returns null for non-numeric coordinates', () => {
    expect(
      organizationPoint(
        org({ location: { type: 'Point', coordinates: ['48.6', '31.3'] as never } }),
      ),
    ).toBeNull();
    expect(
      organizationPoint(
        org({ location: { type: 'Point', coordinates: [Number.NaN, 31.3] } }),
      ),
    ).toBeNull();
  });

  it('rejects coordinates outside the globe', () => {
    // Swapped input: 200 as a latitude would be nonsense.
    expect(
      organizationPoint(org({ location: { type: 'Point', coordinates: [48.6, 200] } })),
    ).toBeNull();
    expect(
      organizationPoint(org({ location: { type: 'Point', coordinates: [181, 31.3] } })),
    ).toBeNull();
  });

  it('accepts the exact extremes of the valid range', () => {
    expect(organizationPoint(org({ location: { type: 'Point', coordinates: [-180, -90] } }))).toEqual({
      latitude: -90,
      longitude: -180,
    });
    expect(organizationPoint(org({ location: { type: 'Point', coordinates: [180, 90] } }))).toEqual({
      latitude: 90,
      longitude: 180,
    });
  });
});

describe('organizationZoom', () => {
  it('returns the organization zoom when it is valid', () => {
    expect(organizationZoom(org({ location_zoom: 13 }))).toBe(13);
  });

  it('falls back when the organization or the zoom is absent', () => {
    expect(organizationZoom(null)).toBe(DEFAULT_INCIDENT_ZOOM);
    expect(organizationZoom(org())).toBe(DEFAULT_INCIDENT_ZOOM);
    expect(organizationZoom(org({ location_zoom: undefined }))).toBe(DEFAULT_INCIDENT_ZOOM);
  });

  it('honours a caller-supplied fallback', () => {
    expect(organizationZoom(null, 15)).toBe(15);
  });

  it('clamps to the same 3..19 range the web map uses', () => {
    expect(organizationZoom(org({ location_zoom: 1 }))).toBe(MIN_MAP_ZOOM);
    expect(organizationZoom(org({ location_zoom: 99 }))).toBe(MAX_MAP_ZOOM);
    expect(organizationZoom(org({ location_zoom: 3 }))).toBe(3);
    expect(organizationZoom(org({ location_zoom: 19 }))).toBe(19);
  });

  it('ignores a non-numeric or non-finite zoom', () => {
    expect(organizationZoom(org({ location_zoom: 'بزرگ' as never }))).toBe(DEFAULT_INCIDENT_ZOOM);
    expect(organizationZoom(org({ location_zoom: Number.NaN }))).toBe(DEFAULT_INCIDENT_ZOOM);
    expect(organizationZoom(org({ location_zoom: Infinity }))).toBe(DEFAULT_INCIDENT_ZOOM);
  });

  it('rounds a fractional zoom', () => {
    expect(organizationZoom(org({ location_zoom: 13.6 }))).toBe(14);
    expect(organizationZoom(org({ location_zoom: 13.2 }))).toBe(13);
  });
});

describe('formatCoordinates', () => {
  it('renders longitude first, then latitude', () => {
    expect(formatCoordinates({ latitude: 31.31823, longitude: 48.67056 })).toContain('۴۸٫۶۷۰۶');
  });
});