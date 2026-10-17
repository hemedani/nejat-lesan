/**
 * Deciding *what* a map pack request means, with no I/O.
 *
 * Split out of `map-download.ts` because the interesting behaviour is
 * judgement — does this request widen the pack, re-queue it, or refuse it —
 * and that judgement is exactly what regressed silently when the downloader
 * knew about only one pack and one zoom range.
 */

import { combineCoverage, coverageFromZooms, type MapCoverage } from './map-coverage';
import { AREA_TIER, boundsForRadius, type CenterPoint } from './map-area-pack';
import { estimatePack, IRAN_BOUNDS, type GeoBounds, type MapTier, type MapTierId } from './map-packs';

export const NATIONAL_PACK_ID = 'national';
export const AREA_PACK_ID = 'area';

export type PackStatus = 'idle' | 'queued' | 'downloading' | 'paused' | 'done' | 'failed';

export type PackShape = {
  id: string;
  status: PackStatus;
  zoom_min: number;
  zoom_max: number;
  tiles_total?: number;
  tiles_done?: number;
  bounds?: GeoBounds;
  error?: string;
};

/** The narrowest description of a stored pack that planning needs. */
export type ExistingPack = PackShape & {
  bytes_done: number;
  created_at: string;
  tiles_done: number;
  tiles_total: number;
  updated_at: string;
};

export type PlannedPack = ExistingPack & { bounds: GeoBounds | null };

export type PlanInput = {
  center: CenterPoint | null;
  radiusKm: number;
  tier: MapTier;
};

export type PlanResult = {
  action: 'create' | 'update' | 'requeue' | 'skip';
  pack?: PlannedPack;
  reason?: string;
};

/** The tile box a pack covers; the area pack needs a centre to have one. */
export function packBounds(id: string, bounds?: GeoBounds | null): GeoBounds | null {
  if (id === NATIONAL_PACK_ID) {
    return IRAN_BOUNDS;
  }
  if (id === AREA_PACK_ID) {
    return bounds ?? null;
  }
  return null;
}

export function packLabel(id: string): string {
  return id === AREA_PACK_ID ? 'محدوده سازمان' : 'نقشه سراسری ایران';
}

/** The zoom range this pack should end up covering. */
function tierFor(id: string, input: PlanInput): MapTier {
  if (id === AREA_PACK_ID) {
    return input.tier;
  }
  return { id: 'base' as MapTierId, zoomMin: input.tier.zoomMin, zoomMax: input.tier.zoomMax };
}

/** Tile count a request would cover, or 0 when the request is unscoped. */
export function estimatePackTiles(id: string, input: PlanInput): number {
  const bounds = packBounds(id, boundsForRadius(input.center, input.radiusKm));
  if (!bounds) {
    return 0;
  }
  return estimatePack(tierFor(id, input), bounds).tilesTotal;
}

/** Builds a fresh area-pack record from the org centre and a radius. */
export function buildAreaPackRecord(center: CenterPoint | null, radiusKm: number): PlannedPack | null {
  const bounds = boundsForRadius(center, radiusKm);
  if (!bounds) {
    return null;
  }
  const timestamp = new Date().toISOString();
  return {
    bounds,
    bytes_done: 0,
    created_at: timestamp,
    error: undefined,
    id: AREA_PACK_ID,
    status: 'idle',
    tiles_done: 0,
    tiles_total: estimatePack(AREA_TIER, bounds).tilesTotal,
    updated_at: timestamp,
    zoom_max: AREA_TIER.zoomMax,
    zoom_min: AREA_TIER.zoomMin,
  };
}

/**
 * Decides how to satisfy a download request for `id`.
 *
 * The distinction that matters: a *larger* request (bigger radius, deeper zoom)
 * replaces the plan and keeps the already-downloaded files, because the tile
 * mirror is keyed by `z/x/y` and simply skips what exists. An identical request
 * is a plain re-queue that must not reset progress counters.
 */
export function planPackStart(
  id: string,
  input: PlanInput,
  existing: ExistingPack | null,
): PlanResult {
  const bounds = packBounds(id, boundsForRadius(input.center, input.radiusKm));
  if (!bounds) {
    return {
      action: 'skip',
      reason:
        id === AREA_PACK_ID
          ? 'مرکز سازمان ثبت نشده است؛ محدوده‌ای برای دانلود وجود ندارد.'
          : 'محدوده‌ی دانلود مشخص نیست.',
    };
  }

  const tier = tierFor(id, input);
  const timestamp = new Date().toISOString();

  if (!existing) {
    return {
      action: 'create',
      pack: {
        bounds,
        bytes_done: 0,
        created_at: timestamp,
        error: undefined,
        id,
        status: 'queued',
        tiles_done: 0,
        tiles_total: estimatePack(tier, bounds).tilesTotal,
        updated_at: timestamp,
        zoom_max: tier.zoomMax,
        zoom_min: tier.zoomMin,
      },
    };
  }

  const widened =
    tier.zoomMax > existing.zoom_max ||
    existing.zoom_min > tier.zoomMin ||
    !sameBounds(existing.bounds ?? null, bounds);

  if (widened) {
    return {
      action: 'update',
      pack: {
        ...existing,
        bounds,
        error: undefined,
        status: 'queued',
        // The new total is known up front so the progress bar is honest before
        // the first tile lands; the downloader still recounts from the tile
        // mirror before running, so a stale figure self-corrects.
        tiles_total: estimatePack(tier, bounds).tilesTotal,
        updated_at: timestamp,
        zoom_max: tier.zoomMax,
        zoom_min: tier.zoomMin,
      },
    };
  }

  return {
    action: 'requeue',
    pack: {
      ...existing,
      bounds,
      error: undefined,
      status: 'queued',
      updated_at: timestamp,
    },
  };
}

/**
 * Tolerance for "is this the same box", in degrees.
 *
 * 1e-6° is ~11 cm — far below GPS and backend noise, far above the float
 * jitter of recomputing the same box. Without it, an org `location` that comes
 * back with a different last digit makes every download press look like a
 * widening, which resets the progress counters the officer has been waiting on.
 */
const BOUNDS_EPSILON_DEGREES = 1e-6;

function sameBounds(a: GeoBounds | null, b: GeoBounds | null): boolean {
  if (!a || !b) {
    return a === b;
  }
  return (
    Math.abs(a.minLat - b.minLat) <= BOUNDS_EPSILON_DEGREES &&
    Math.abs(a.maxLat - b.maxLat) <= BOUNDS_EPSILON_DEGREES &&
    Math.abs(a.minLng - b.minLng) <= BOUNDS_EPSILON_DEGREES &&
    Math.abs(a.maxLng - b.maxLng) <= BOUNDS_EPSILON_DEGREES
  );
}

/**
 * The zoom range the map may actually use, unioned across every pack that has
 * produced tiles. An `idle` pack contributes nothing: it has never downloaded,
 * so honouring it would clamp the map to tiles that are not on disk — the
 * blank-map bug all over again.
 */
export function coverageFromPacks(packs: readonly PackShape[]): MapCoverage | null {
  return combineCoverage(
    packs
      .filter(pack => pack.status !== 'idle')
      .map(pack => coverageFromZooms(pack.zoom_min, pack.zoom_max)),
  );
}