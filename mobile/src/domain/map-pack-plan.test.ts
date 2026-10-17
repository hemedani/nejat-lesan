import { describe, expect, it } from 'vitest';

import { boundsForRadius } from './map-area-pack';
import { IRAN_BOUNDS } from './map-packs';
import {
  AREA_PACK_ID,
  buildAreaPackRecord,
  coverageFromPacks,
  NATIONAL_PACK_ID,
  packBounds,
  packLabel,
  planPackStart,
  type ExistingPack,
  type PlanInput,
  type PlanResult,
} from './map-pack-plan';

const AHVAZ = { latitude: 31.318, longitude: 48.67 };
/** The box a 10 km request produces — i.e. "an existing pack for this request". */
const REQUEST_BOUNDS = boundsForRadius(AHVAZ, 10)!;

function record(overrides: Partial<ExistingPack> & { id: string }) {
  return {
    bounds: REQUEST_BOUNDS,
    created_at: '2026-01-01T00:00:00.000Z',
    bytes_done: 0,
    error: undefined,
    status: 'done' as const,
    tiles_done: 0,
    tiles_total: 9430,
    updated_at: '2026-01-01T00:00:00.000Z',
    zoom_max: 17,
    zoom_min: 13,
    ...overrides,
  };
}

describe('pack identifiers', () => {
  it('keeps the national pack id so existing installs keep their row', () => {
    expect(NATIONAL_PACK_ID).toBe('national');
    expect(AREA_PACK_ID).toBe('area');
  });
});

describe('pack bounds', () => {
  it('gives the national pack the whole of Iran and the area pack its own box', () => {
    expect(packBounds(NATIONAL_PACK_ID)).toEqual(IRAN_BOUNDS);
    const area = packBounds(AREA_PACK_ID, { minLat: 1, maxLat: 2, minLng: 3, maxLng: 4 });
    expect(area).toEqual({ maxLat: 2, maxLng: 4, minLat: 1, minLng: 3 });
  });

  it('has no area pack box when the org has no location', () => {
    expect(packBounds(AREA_PACK_ID, null)).toBeNull();
  });
});

describe('buildAreaPackRecord', () => {
  it('returns null when the org has no location', () => {
    expect(buildAreaPackRecord(null, 10)).toBeNull();
  });

  it('sizes the pack to the requested radius and zoom range', () => {
    const pack = buildAreaPackRecord({ latitude: 31.318, longitude: 48.67 }, 10)!;
    expect(pack.id).toBe(AREA_PACK_ID);
    expect(pack.zoom_min).toBe(13);
    expect(pack.zoom_max).toBe(17);
    expect(pack.bounds).toBeDefined();
    expect(pack.tiles_total).toBeGreaterThan(0);
    expect(pack.status).toBe('idle');
  });
});

describe('planPackStart', () => {
  const base: PlanInput = {
    center: { latitude: 31.318, longitude: 48.67 },
    radiusKm: 10,
    tier: { id: 'deep', zoomMin: 13, zoomMax: 17 },
  };

  it('creates the area pack when none exists', () => {
    const result: PlanResult = planPackStart(AREA_PACK_ID, base, null);
    expect(result.action).toBe('create');
    expect(result.pack?.id).toBe(AREA_PACK_ID);
  });

  it('re-queues an already-complete pack without resetting its counters', () => {
    const existing = record({ id: AREA_PACK_ID, status: 'done', tiles_done: 9430, tiles_total: 9430 });
    const result = planPackStart(AREA_PACK_ID, base, existing);
    expect(result.action).toBe('requeue');
    expect(result.pack?.tiles_done).toBe(9430);
  });

  it('widens the pack when the officer picks a larger radius', () => {
    const existing = record({ id: AREA_PACK_ID, status: 'done', tiles_total: 9430 });
    const result = planPackStart(AREA_PACK_ID, { ...base, radiusKm: 25 }, existing);
    expect(result.action).toBe('update');
    const widened = result.pack!.bounds!;
    expect(widened.maxLat - widened.minLat).toBeGreaterThan(existing.bounds!.maxLat - existing.bounds!.minLat);
    expect(result.pack?.tiles_total).toBeGreaterThan(9430);
  });

  it('keeps progress when re-running the same radius after a failure', () => {
    const existing = record({ id: AREA_PACK_ID, status: 'failed', tiles_done: 300, tiles_total: 9430, error: 'خطا' });
    const result = planPackStart(AREA_PACK_ID, base, existing);
    expect(result.action).toBe('requeue');
    expect(result.pack?.tiles_done).toBe(300);
    expect(result.pack?.error).toBeUndefined();
  });

  it('refuses to start the area pack with no centre', () => {
    const result = planPackStart(AREA_PACK_ID, { ...base, center: null }, null);
    expect(result.action).toBe('skip');
    expect(result.reason).toBeTruthy();
  });

  it('treats a box that moved by float noise as the same request', () => {
    const exact = boundsForRadius(base.center, base.radiusKm)!;
    const jittered = {
      maxLat: exact.maxLat + 1e-9,
      maxLng: exact.maxLng - 1e-9,
      minLat: exact.minLat,
      minLng: exact.minLng + 1e-9,
    };
    const existing = record({ id: AREA_PACK_ID, status: 'failed', tiles_done: 300, tiles_total: 9430, bounds: jittered });
    const result = planPackStart(AREA_PACK_ID, base, existing);
    expect(result.action).toBe('requeue');
    expect(result.pack?.tiles_done).toBe(300);
  });
});

describe('coverageFromPacks', () => {
  it('is empty when nothing is downloaded', () => {
    expect(coverageFromPacks([])).toBeNull();
  });

  it('ignores a pack that has not started downloading', () => {
    expect(coverageFromPacks([{ id: NATIONAL_PACK_ID, status: 'idle', zoom_min: 4, zoom_max: 12 }])).toBeNull();
  });

  it('counts a paused national pack plus a running area pack', () => {
    const coverage = coverageFromPacks([
      { id: NATIONAL_PACK_ID, status: 'paused', zoom_min: 4, zoom_max: 12 },
      { id: AREA_PACK_ID, status: 'downloading', zoom_min: 13, zoom_max: 17 },
    ]);
    expect(coverage).toEqual({ zoomMax: 17, zoomMin: 4 });
  });

  it('still counts a finished pack when a newer one failed', () => {
    const coverage = coverageFromPacks([
      { id: NATIONAL_PACK_ID, status: 'done', zoom_min: 4, zoom_max: 12 },
      { id: AREA_PACK_ID, status: 'failed', zoom_min: 13, zoom_max: 17 },
    ]);
    expect(coverage?.zoomMax).toBe(17);
  });
});

describe('packLabel', () => {
  it('describes each pack in Persian', () => {
    expect(packLabel(NATIONAL_PACK_ID)).toMatch(/ایران/);
    expect(packLabel(AREA_PACK_ID)).toMatch(/محدوده/);
  });
});