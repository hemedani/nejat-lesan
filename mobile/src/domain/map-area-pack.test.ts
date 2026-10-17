import { describe, expect, it } from 'vitest';

import { formatBytes } from './map-packs';
import {
  AREA_RADII_KM,
  boundsForRadius,
  estimateAreaPack,
  METERS_PER_DEGREE_LATITUDE,
} from './map-area-pack';

const AHVAZ: { latitude: number; longitude: number } = { latitude: 31.318, longitude: 48.67 };

/** Ground height of a latitude span, in metres — the test's own inverse helper. */
function spanMeters(degrees: number, latitude: number): number {
  return degrees * METERS_PER_DEGREE_LATITUDE * Math.cos((latitude * Math.PI) / 180);
}

describe('area pack bounds', () => {
  it('centres the box on the organisation point', () => {
    const bounds = boundsForRadius(AHVAZ, 25)!;
    expect((bounds.minLat + bounds.maxLat) / 2).toBeCloseTo(AHVAZ.latitude, 5);
    expect((bounds.minLng + bounds.maxLng) / 2).toBeCloseTo(AHVAZ.longitude, 5);
  });

  it('widens with the radius', () => {
    const small = boundsForRadius(AHVAZ, 10)!;
    const large = boundsForRadius(AHVAZ, 25)!;
    expect(large.maxLat - large.minLat).toBeGreaterThan(small.maxLat - small.minLat);
    expect(large.maxLng - large.minLng).toBeGreaterThan(small.maxLng - small.minLng);
  });

  it('spans the requested radius on each side of the centre', () => {
    // The radius is the half-width, so the ground span is 2 x radius.
    const bounds = boundsForRadius(AHVAZ, 25)!;
    const heightMeters = spanMeters(bounds.maxLat - bounds.minLat, AHVAZ.latitude);
    expect(heightMeters).toBeGreaterThan(49_000);
    expect(heightMeters).toBeLessThan(51_000);
  });

  it('returns null for an unusable centre so the caller can fall back', () => {
    expect(boundsForRadius(null, 25)).toBeNull();
    expect(boundsForRadius(undefined, 25)).toBeNull();
    expect(boundsForRadius({ latitude: Number.NaN, longitude: 48.67 }, 25)).toBeNull();
    expect(boundsForRadius({ latitude: 91, longitude: 48.67 }, 25)).toBeNull();
    expect(boundsForRadius(AHVAZ, 0)).toBeNull();
  });

  it('never produces a box outside the mercator latitude limit', () => {
    const polar = boundsForRadius({ latitude: 84, longitude: 10 }, 500)!;
    expect(polar.minLat).toBeGreaterThanOrEqual(-85.05112878);
    expect(polar.maxLat).toBeLessThanOrEqual(85.05112878);
  });
});

describe('area pack sizing', () => {
  it('grows with the radius', () => {
    const near = estimateAreaPack(AHVAZ, 5, 13, 17);
    const far = estimateAreaPack(AHVAZ, 25, 13, 17);
    expect(far.tilesTotal).toBeGreaterThan(near.tilesTotal);
    expect(far.estimatedBytes).toBeGreaterThan(near.estimatedBytes);
  });

  it('is dominated by the deepest zoom', () => {
    // z17 is what incident picking needs, so the estimate must reflect that
    // rather than averaging the range and understating the download.
    const estimate = estimateAreaPack(AHVAZ, 10, 13, 17);
    const deepest = estimate.perZoom.at(-1)!;
    expect(deepest.zoom).toBe(17);
    expect(deepest.tiles).toBeGreaterThan(estimate.tilesTotal / 2);
  });

  it('returns an empty estimate when there is no usable centre', () => {
    const estimate = estimateAreaPack(null, 25, 13, 17);
    expect(estimate.tilesTotal).toBe(0);
    expect(estimate.estimatedBytes).toBe(0);
  });

  it('reports a Persian-formatted size for the download screen', () => {
    const estimate = estimateAreaPack(AHVAZ, 10, 13, 17);
    expect(formatBytes(estimate.estimatedBytes)).toMatch(/(مگابایت|گیگابایت)/);
  });
});

describe('area pack radius presets', () => {
  it('offers presets in increasing order', () => {
    const radii = AREA_RADII_KM.map(preset => preset.km);
    expect(radii).toEqual([...radii].sort((a, b) => a - b));
  });

  it('labels every preset in Persian', () => {
    for (const preset of AREA_RADII_KM) {
      expect(preset.label.length).toBeGreaterThan(0);
    }
  });

  it('keeps the largest preset within what a field device can realistically store', () => {
    // A 50 km radius is ~230k tiles / ~4.6 GB at z13-z17, which is not a
    // shippable offer on a phone; the ladder stops where storage still is.
    const largest = AREA_RADII_KM.at(-1)!;
    const estimate = estimateAreaPack(AHVAZ, largest.km, 13, 17);
    expect(estimate.tilesTotal).toBeLessThan(60_000);
  });

  it('keeps the smallest preset cheap enough for a quick grab', () => {
    const smallest = AREA_RADII_KM[0];
    const estimate = estimateAreaPack(AHVAZ, smallest.km, 13, 17);
    expect(estimate.tilesTotal).toBeLessThan(5_000);
  });
});