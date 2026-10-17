import { describe, expect, it } from 'vitest';

import { AREA_TIER, boundsForRadius } from './map-area-pack';
import { IRAN_BOUNDS, MAP_TIERS } from './map-packs';
import {
  AREA_PACK_ID,
  coverageFromPacks,
  NATIONAL_PACK_ID,
  packBounds,
  packLabel,
  planPackStart,
  type ExistingPack,
  type PlanInput,
  type PackPlan,
} from './map-pack-plan';

const AHVAZ = { latitude: 31.318, longitude: 48.67 };
/** The box a 10 km request produces — i.e. "an existing pack for this request". */
const REQUEST_BOUNDS = boundsForRadius(AHVAZ, 10)!;

const AREA_REQUEST: PlanInput = { center: AHVAZ, radiusKm: 10, tier: AREA_TIER };

function existing(overrides: Partial<ExistingPack> = {}): ExistingPack {
  return {
    bounds: REQUEST_BOUNDS,
    zoomMax: AREA_TIER.zoomMax,
    zoomMin: AREA_TIER.zoomMin,
    ...overrides,
  };
}

describe('pack identifiers', () => {
  it('keeps the ids the metadata and UI key on', () => {
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

describe('planPackStart', () => {
  it('creates the area pack when none exists', () => {
    const result: PackPlan = planPackStart(AREA_PACK_ID, AREA_REQUEST, null);
    expect(result.action).toBe('create');
    if (result.action === 'create') {
      expect(result.zoomMin).toBe(AREA_TIER.zoomMin);
      expect(result.zoomMax).toBe(AREA_TIER.zoomMax);
      expect(result.tilesTotal).toBeGreaterThan(0);
    }
  });

  it('reuses an existing pack that already covers the request', () => {
    expect(planPackStart(AREA_PACK_ID, AREA_REQUEST, existing()).action).toBe('reuse');
  });

  it('treats a box that moved by float noise as the same request', () => {
    const jittered = {
      maxLat: REQUEST_BOUNDS.maxLat + 1e-9,
      maxLng: REQUEST_BOUNDS.maxLng - 1e-9,
      minLat: REQUEST_BOUNDS.minLat,
      minLng: REQUEST_BOUNDS.minLng + 1e-9,
    };
    expect(planPackStart(AREA_PACK_ID, AREA_REQUEST, existing({ bounds: jittered })).action).toBe(
      'reuse',
    );
  });

  it('creates a new pack when the officer picks a larger radius', () => {
    const result = planPackStart(
      AREA_PACK_ID,
      { ...AREA_REQUEST, radiusKm: 25 },
      existing(),
    );
    expect(result.action).toBe('create');
    if (result.action === 'create') {
      const widened = result.bounds;
      expect(widened.maxLat - widened.minLat).toBeGreaterThan(
        REQUEST_BOUNDS.maxLat - REQUEST_BOUNDS.minLat,
      );
    }
  });

  it('creates a new pack when the request reaches deeper than the existing one', () => {
    const existingBase = existing({
      bounds: IRAN_BOUNDS,
      zoomMax: MAP_TIERS.base.zoomMax,
      zoomMin: MAP_TIERS.base.zoomMin,
    });
    const result = planPackStart(
      NATIONAL_PACK_ID,
      { center: null, radiusKm: 0, tier: MAP_TIERS.deep },
      existingBase,
    );
    expect(result.action).toBe('create');
  });

  it('reuses the national pack when the existing one already reaches the requested depth', () => {
    const existingDeep = existing({
      bounds: IRAN_BOUNDS,
      zoomMax: MAP_TIERS.deep.zoomMax,
      zoomMin: MAP_TIERS.deep.zoomMin,
    });
    const result = planPackStart(
      NATIONAL_PACK_ID,
      { center: null, radiusKm: 0, tier: MAP_TIERS.base },
      existingDeep,
    );
    expect(result.action).toBe('reuse');
  });

  it('refuses to start the area pack with no centre', () => {
    const result = planPackStart(AREA_PACK_ID, { ...AREA_REQUEST, center: null }, null);
    expect(result.action).toBe('skip');
    if (result.action === 'skip') {
      expect(result.reason).toBeTruthy();
    }
  });
});

describe('coverageFromPacks', () => {
  it('is empty when nothing is downloaded', () => {
    expect(coverageFromPacks([])).toBeNull();
  });

  it('ignores a pack that has not started downloading', () => {
    expect(coverageFromPacks([{ status: 'idle', zoomMin: 4, zoomMax: 12 }])).toBeNull();
  });

  it('counts a paused national pack plus a running area pack', () => {
    const coverage = coverageFromPacks([
      { status: 'paused', zoomMin: 4, zoomMax: 12 },
      { status: 'downloading', zoomMin: 13, zoomMax: 14 },
    ]);
    expect(coverage).toEqual({ zoomMax: 14, zoomMin: 4 });
  });

  it('still counts a finished pack when a newer one failed', () => {
    const coverage = coverageFromPacks([
      { status: 'done', zoomMin: 4, zoomMax: 12 },
      { status: 'failed', zoomMin: 13, zoomMax: 14 },
    ]);
    expect(coverage?.zoomMax).toBe(14);
  });
});

describe('packLabel', () => {
  it('describes each pack in Persian', () => {
    expect(packLabel(NATIONAL_PACK_ID)).toMatch(/ایران/);
    expect(packLabel(AREA_PACK_ID)).toMatch(/محدوده/);
  });
});
