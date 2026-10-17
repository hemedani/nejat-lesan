import { describe, expect, it } from 'vitest';

import { combineCoverage, coverageFromZooms } from './map-coverage';

describe('map coverage — describing what is on disk', () => {
  it('normalises a valid zoom pair, lowest first', () => {
    expect(coverageFromZooms(4, 14)).toEqual({ zoomMin: 4, zoomMax: 14 });
    expect(coverageFromZooms(14, 4)).toEqual({ zoomMin: 4, zoomMax: 14 });
  });

  it('rounds fractional zooms to the tile level', () => {
    expect(coverageFromZooms(4.4, 13.6)).toEqual({ zoomMin: 4, zoomMax: 14 });
  });

  it('refuses a range it cannot describe', () => {
    expect(coverageFromZooms(Number.NaN, 14)).toBeNull();
    expect(coverageFromZooms(4, Number.NaN)).toBeNull();
  });
});

describe('map coverage — combining packs', () => {
  it('unions a national pack and an area pack into one usable coverage', () => {
    const coverage = combineCoverage([coverageFromZooms(4, 12), coverageFromZooms(13, 14)]);
    expect(coverage).toEqual({ zoomMin: 4, zoomMax: 14 });
  });

  it('reports null when nothing is downloaded', () => {
    expect(combineCoverage([])).toBeNull();
    expect(combineCoverage([null])).toBeNull();
  });

  it('keeps the union of overlapping packs without widening the low end', () => {
    const coverage = combineCoverage([coverageFromZooms(6, 12), coverageFromZooms(4, 10)]);
    expect(coverage).toEqual({ zoomMin: 4, zoomMax: 12 });
  });
});
