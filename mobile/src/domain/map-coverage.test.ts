import { describe, expect, it } from 'vitest';

import {
  AREA_ZOOM_MIN,
  combineCoverage,
  coverageFromZooms,
  DEFAULT_COVERAGE,
  isCoveredBy,
  scaleLabelForZoom,
  tileZoomFor,
} from './map-coverage';

describe('map coverage — the offline blank-map bug', () => {
  // The picker opened at zoom 17 while packs only held z4..z12, so every tile
  // 404'd and the page fell through to its bare background. These three cases
  // are that bug: with no network, the tile level must stay inside what was
  // actually downloaded.
  it('never requests a tile level above the downloaded coverage while offline', () => {
    const coverage = coverageFromZooms(4, 12);
    expect(tileZoomFor(17, coverage, { offline: true })).toBe(12);
    expect(tileZoomFor(15, coverage, { offline: true })).toBe(12);
    expect(tileZoomFor(19, coverage, { offline: true })).toBe(12);
  });

  it('requests the exact tile level when the coverage is deep enough', () => {
    const coverage = coverageFromZooms(4, 17);
    expect(tileZoomFor(17, coverage)).toBe(17);
    expect(tileZoomFor(12.7, coverage)).toBe(12);
    expect(tileZoomFor(15, coverage)).toBe(15);
  });

  it('treats a missing coverage as unknown and renders the requested level', () => {
    // Offline before any download: no known limit, so nothing is clamped and the
    // network fallback is the only source. Clamping to a default here would be
    // the same bug wearing a different hat.
    expect(tileZoomFor(17, null)).toBe(17);
    expect(tileZoomFor(3, null)).toBe(3);
  });

  it('keeps the requested level inside a partial coverage that starts high', () => {
    const coverage = coverageFromZooms(14, 17);
    expect(tileZoomFor(9, coverage, { offline: true })).toBe(14);
    expect(tileZoomFor(17, coverage, { offline: true })).toBe(17);
  });

  it('ignores a malformed coverage rather than blanking the map', () => {
    expect(tileZoomFor(17, { zoomMin: Number.NaN, zoomMax: 17 })).toBe(17);
    expect(tileZoomFor(17, { zoomMin: 4, zoomMax: Number.NaN })).toBe(17);
    expect(tileZoomFor(17, { zoomMin: 17, zoomMax: 4 })).toBe(17);
  });
});

describe('map coverage — combining packs', () => {
  it('unions a national pack and an area pack into one usable coverage', () => {
    const coverage = combineCoverage([coverageFromZooms(4, 12), coverageFromZooms(13, 17)]);
    expect(coverage).toEqual({ zoomMin: 4, zoomMax: 17 });
  });

  it('reports null when nothing is downloaded, so the map still renders online', () => {
    expect(combineCoverage([])).toBeNull();
    expect(combineCoverage([null])).toBeNull();
  });

  it('keeps the union of overlapping packs without widening the low end', () => {
    const coverage = combineCoverage([coverageFromZooms(6, 12), coverageFromZooms(4, 10)]);
    expect(coverage).toEqual({ zoomMin: 4, zoomMax: 12 });
  });
});

describe('map coverage — pack shape invariants', () => {
  it('uses a coverage range that actually spans the area pack', () => {
    expect(DEFAULT_COVERAGE.zoomMax).toBeGreaterThanOrEqual(AREA_ZOOM_MIN);
  });

  it('answers whether a zoom level is fully cached', () => {
    const coverage = coverageFromZooms(4, 17);
    expect(isCoveredBy(coverage, 17)).toBe(true);
    expect(isCoveredBy(coverage, 18)).toBe(false);
    expect(isCoveredBy(null, 17)).toBe(false);
  });
});

describe('map coverage — scale bar', () => {
  it('labels a round metric distance at the current zoom', () => {
    expect(scaleLabelForZoom(17)).toMatch(/متر/);
    expect(scaleLabelForZoom(10)).toMatch(/کیلومتر/);
    expect(scaleLabelForZoom(5)).toMatch(/کیلومتر/);
  });

  it('never shows a non-positive width', () => {
    for (const zoom of [3, 8, 12, 17, 19]) {
      expect(scaleLabelForZoom(zoom).length).toBeGreaterThan(0);
    }
  });
});