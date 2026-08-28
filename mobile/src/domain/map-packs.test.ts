import { describe, expect, it } from 'vitest';

import {
  estimatePack,
  formatBytes,
  IRAN_BOUNDS,
  iterTiles,
  latToTileY,
  lngToTileX,
  MAP_TIERS,
  tileCountForBounds,
} from './map-packs';

describe('slippy-map math', () => {
  it('matches the well-known OSM tile for Tehran at z10', () => {
    expect(Math.floor(lngToTileX(51.389, 10))).toBe(658);
    expect(Math.floor(latToTileY(35.689, 10))).toBe(403);
  });

  it('clamps out-of-range input', () => {
    expect(Math.floor(lngToTileX(200, 1))).toBeLessThanOrEqual(2);
    expect(Math.floor(latToTileY(95, 1))).toBeLessThanOrEqual(2);
  });
});

describe('Iran pack estimation', () => {
  it('keeps the base tier in the feasible size band (~60–120MB)', () => {
    const base = estimatePack(MAP_TIERS.base);
    // Independent mercator estimate puts Iran at ~0.29% of world area per zoom.
    expect(base.tilesTotal).toBeGreaterThan(3_000);
    expect(base.tilesTotal).toBeLessThan(6_000);
    const z8 = base.perZoom.find(entry => entry.zoom === 8)?.tiles ?? 0;
    expect(z8).toBeGreaterThan(140);
    expect(z8).toBeLessThan(260);
  });

  it('grows roughly fourfold per extra zoom level', () => {
    const deep = estimatePack(MAP_TIERS.deep);
    const z10 = deep.perZoom.find(entry => entry.zoom === 10)?.tiles ?? 0;
    const z11 = deep.perZoom.find(entry => entry.zoom === 11)?.tiles ?? 0;
    expect(z11).toBeGreaterThan(z10 * 3.5);
    // Independent mercator sizing for Iran puts the deep tier near ~65k tiles.
    expect(deep.tilesTotal).toBeGreaterThan(50_000);
    expect(deep.tilesTotal).toBeLessThan(90_000);
    expect(tileCountForBounds(IRAN_BOUNDS, 12)).toBeGreaterThan(
      tileCountForBounds(IRAN_BOUNDS, 11),
    );
  });

  it('counts a single point as exactly one tile', () => {
    const pointBounds = { minLat: 35.689, maxLat: 35.689, minLng: 51.389, maxLng: 51.389 };
    expect(tileCountForBounds(pointBounds, 10)).toBe(1);
  });
});

describe('tile iteration', () => {
  it('visits every estimated tile exactly once, zoom-ascending', () => {
    const seen = new Set<string>();
    let firstZoom: number | null = null;
    let lastZoom: number | null = null;
    let count = 0;
    iterTiles(MAP_TIERS.base, tile => {
      if (firstZoom == null) {
        firstZoom = tile.z;
      }
      lastZoom = tile.z;
      const key = `${tile.z}/${tile.x}/${tile.y}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      const n = Math.pow(2, tile.z);
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.x).toBeLessThan(n);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeLessThan(n);
      count += 1;
    });
    expect(count).toBe(estimatePack(MAP_TIERS.base).tilesTotal);
    expect(firstZoom).toBe(MAP_TIERS.base.zoomMin);
    expect(lastZoom).toBe(MAP_TIERS.base.zoomMax);
  });

  it('stops early when the visitor returns false', () => {
    let visits = 0;
    iterTiles(MAP_TIERS.base, () => {
      visits += 1;
      return visits >= 7 ? false : undefined;
    });
    expect(visits).toBe(7);
  });

  it('yields the expected single tile for a tiny bounds window', () => {
    const coords: { x: number; y: number; z: number }[] = [];
    iterTiles({ id: 'base', zoomMin: 2, zoomMax: 2 }, tile => {
      coords.push(tile);
    }, { minLat: 35.689, maxLat: 35.69, minLng: 51.389, maxLng: 51.39 });
    expect(coords).toEqual([{ x: 2, y: 1, z: 2 }]);
  });
});

describe('formatBytes', () => {
  it('renders Persian units', () => {
    expect(formatBytes(0)).toBe('۰');
    expect(formatBytes(512 * 1024)).toContain('کیلوبایت');
    expect(formatBytes(5 * 1024 * 1024)).toContain('مگابایت');
    expect(formatBytes(1536 * 1024 * 1024)).toContain('گیگابایت');
  });
});
