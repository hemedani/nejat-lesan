/**
 * Deciding *what* a map pack request means, with no I/O.
 *
 * Split out of `map-download.ts` because the interesting behaviour is
 * judgement — does this request need a fresh pack, can an existing one be
 * reused, or is it unsatisfiable — and that judgement is what regressed
 * silently when the downloader knew about only one pack and one zoom range.
 *
 * Since MapLibre's `OfflineManager` owns the packs themselves (bounds and zoom
 * are fixed at creation and cannot be widened in place), planning a request
 * answers one of three things: refuse it, reuse the pack already on disk, or
 * create a new one — the caller deletes the outgrown pack first.
 */

import { boundsForRadius, type CenterPoint } from './map-area-pack';
import { combineCoverage, coverageFromZooms, type MapCoverage } from './map-coverage';
import { estimatePack, IRAN_BOUNDS, type GeoBounds, type MapTier } from './map-packs';

export const NATIONAL_PACK_ID = 'national';
export const AREA_PACK_ID = 'area';

export type PackId = typeof NATIONAL_PACK_ID | typeof AREA_PACK_ID;

export type PackStatus = 'idle' | 'queued' | 'downloading' | 'paused' | 'done' | 'failed';

/** The download states MapLibre's `OfflineManager` reports for a pack. */
export type NativePackState = 'inactive' | 'active' | 'complete';

/**
 * Folds the app-level facts (did it fail, did we pause it) into the status the
 * UI shows.
 *
 * The subtle case is `inactive`: MapLibre reports it both for a pack that has
 * never downloaded and for one we paused mid-flight, so reading it alone is
 * what made a half-finished 30 MB pack render as «شروع نشده». A pack with any
 * completed resource has bytes on disk, so it is paused, not untouched.
 */
export function resolvePackStatus(input: {
  completedResources: number;
  failed: boolean;
  nativeState: NativePackState;
  paused: boolean;
}): PackStatus {
  if (input.failed) {
    return 'failed';
  }
  if (input.nativeState === 'complete') {
    return 'done';
  }
  if (input.nativeState === 'active') {
    return 'downloading';
  }
  if (input.paused || input.completedResources > 0) {
    return 'paused';
  }
  return 'idle';
}

/**
 * Whether a stored pack belongs to the tile server the app points at now.
 *
 * MapLibre keys its offline database by the exact style-URL string, so a pack
 * built against a different host is dead weight: the current map can never read
 * its tiles, and an old build's pack that still resumes only earns 404s. Packs
 * are stamped with `styleUrl` at creation, and anything else is pruned.
 */
export function packMatchesStyleUrl(metadata: Record<string, unknown>, styleUrl: string): boolean {
  return metadata.styleUrl === styleUrl;
}

/** The narrowest description of a stored pack that planning needs. */
export type ExistingPack = {
  bounds: GeoBounds | null;
  zoomMin: number;
  zoomMax: number;
};

export type PlanInput = {
  center: CenterPoint | null;
  radiusKm: number;
  tier: MapTier;
};

export type PackPlan =
  | { action: 'skip'; reason: string }
  | { action: 'reuse' }
  | { action: 'create'; bounds: GeoBounds; zoomMin: number; zoomMax: number; tilesTotal: number };

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

/**
 * Decides how to satisfy a download request for `id`.
 *
 * Reuse requires the whole request to be covered — the existing pack must reach
 * at least as deep, start no deeper, and sit on the same box. Anything less is
 * a `create`; `OfflineManager` cannot widen a pack in place, so the caller
 * replaces it.
 */
export function planPackStart(id: string, input: PlanInput, existing: ExistingPack | null): PackPlan {
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

  const tier = input.tier;
  if (
    existing &&
    existing.zoomMax >= tier.zoomMax &&
    existing.zoomMin <= tier.zoomMin &&
    sameBounds(existing.bounds ?? null, bounds)
  ) {
    return { action: 'reuse' };
  }

  return {
    action: 'create',
    bounds,
    zoomMax: tier.zoomMax,
    zoomMin: tier.zoomMin,
    tilesTotal: estimatePack(tier, bounds).tilesTotal,
  };
}

/**
 * Tolerance for "is this the same box", in degrees.
 *
 * 1e-6° is ~11 cm — far below GPS and backend noise, far above the float
 * jitter of recomputing the same box. Without it, an org `location` that comes
 * back with a different last digit makes every download press look like a new
 * request and throws away a finished pack.
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
 * so counting it would advertise a range that is not on disk — the blank-map
 * bug all over again.
 */
export function coverageFromPacks(
  packs: readonly { status: PackStatus; zoomMin: number; zoomMax: number }[],
): MapCoverage | null {
  return combineCoverage(
    packs
      .filter(pack => pack.status !== 'idle')
      .map(pack => coverageFromZooms(pack.zoomMin, pack.zoomMax)),
  );
}
