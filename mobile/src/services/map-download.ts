import {
  OfflineManager,
  type LngLatBounds,
  type OfflinePack,
  type OfflinePackError,
  type OfflinePackStatus,
} from '@maplibre/maplibre-react-native';

import { getAppConfig } from '@/config/env';
import { AREA_RADII_KM, AREA_TIER, type CenterPoint } from '@/domain/map-area-pack';
import {
  AREA_PACK_ID,
  NATIONAL_PACK_ID,
  coverageFromPacks,
  planPackStart,
  type ExistingPack,
  type PackId,
  type PackStatus,
  type PlanInput,
} from '@/domain/map-pack-plan';
import { MAP_TIERS, type GeoBounds, type MapTierId } from '@/domain/map-packs';
import { getSetting, saveSetting } from '@/storage/local-database';
import { getConnectivitySnapshot, subscribeToConnectivity } from '@/services/connectivity';

/**
 * Offline map packs, on top of MapLibre's own `OfflineManager`.
 *
 * `OfflineManager` owns the packs: it downloads the style's tiles, glyphs, and
 * sprites into its own database and remembers them across restarts. This module
 * is the thin, app-shaped layer over it — the two packs the officer was offered,
 * the Wi-Fi-only policy, and the network-aware pause/resume that MapLibre does
 * not model. It keeps no pack rows of its own; `OfflineManager.getPacks()` is
 * the single source of truth.
 */

const WIFI_ONLY_SETTING_KEY = 'map_wifi_only';
export const DEFAULT_WIFI_ONLY = true;

const CELLULAR_PAUSE_HINT =
  'دانلود به دلیل فعال بودن گزینه «فقط وای‌فای» متوقف شد؛ با اتصال به وای‌فای ادامه می‌یابد.';
const OFFLINE_PAUSE_HINT = 'بدون اینترنت؛ دانلود نقشه پس از اتصال ادامه می‌یابد.';

export type MapPackView = {
  id: PackId;
  status: PackStatus;
  tierId: MapTierId | null;
  zoomMin: number;
  zoomMax: number;
  tilesTotal: number;
  tilesDone: number;
  bytesDone: number;
  error?: string;
};

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach(listener => listener());
}

export function subscribeToMapPacks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * State `OfflineManager` does not keep.
 *
 * A pack's download state is only `inactive | active | complete`; "the officer
 * paused it" and "we paused it because the radio dropped" are app-level facts,
 * so they live here and are folded into the status the UI reads.
 */
const manuallyPaused = new Set<PackId>();
const networkPauseReasons = new Map<PackId, string>();
const packErrors = new Map<PackId, string>();

function packIdOf(pack: OfflinePack): PackId | null {
  const id = (pack.metadata as { packId?: unknown }).packId;
  return id === NATIONAL_PACK_ID || id === AREA_PACK_ID ? id : null;
}

function metaNumber(pack: OfflinePack, key: string): number | null {
  const value = (pack.metadata as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function metaTier(pack: OfflinePack): MapTierId | null {
  const value = (pack.metadata as { tierId?: unknown }).tierId;
  return value === 'base' || value === 'deep' ? value : null;
}

function toLngLatBounds(bounds: GeoBounds): LngLatBounds {
  return [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat];
}

function fromLngLatBounds(bounds: LngLatBounds): GeoBounds {
  return { maxLat: bounds[3], maxLng: bounds[2], minLat: bounds[1], minLng: bounds[0] };
}

function asPackId(id: string): PackId | null {
  return id === NATIONAL_PACK_ID || id === AREA_PACK_ID ? id : null;
}

async function findNative(id: PackId): Promise<OfflinePack | null> {
  const packs = await OfflineManager.getPacks();
  return packs.find(pack => packIdOf(pack) === id) ?? null;
}

function toExisting(pack: OfflinePack): ExistingPack {
  return {
    bounds: fromLngLatBounds(pack.bounds),
    zoomMax: metaNumber(pack, 'zoomMax') ?? 0,
    zoomMin: metaNumber(pack, 'zoomMin') ?? 0,
  };
}

function toView(pack: OfflinePack, id: PackId, status: OfflinePackStatus): MapPackView {
  const zoomMin = metaNumber(pack, 'zoomMin') ?? 0;
  const zoomMax = metaNumber(pack, 'zoomMax') ?? 0;
  const paused = manuallyPaused.has(id) || networkPauseReasons.has(id);
  let state: PackStatus;
  if (packErrors.has(id)) {
    state = 'failed';
  } else if (paused) {
    state = 'paused';
  } else if (status.state === 'complete') {
    state = 'done';
  } else if (status.state === 'active') {
    state = 'downloading';
  } else {
    state = 'idle';
  }
  return {
    bytesDone: status.completedResourceSize,
    error: packErrors.get(id) ?? networkPauseReasons.get(id),
    id,
    status: state,
    tierId: metaTier(pack) ?? (zoomMax >= MAP_TIERS.deep.zoomMax ? 'deep' : 'base'),
    tilesDone: status.completedResourceCount,
    tilesTotal: status.requiredResourceCount,
    zoomMax,
    zoomMin,
  };
}

/** Both packs, shallowest first, for the offline maps screen. */
export async function getMapPackViews(): Promise<MapPackView[]> {
  const native = await OfflineManager.getPacks();
  const views: MapPackView[] = [];
  for (const pack of native) {
    const id = packIdOf(pack);
    if (!id) {
      continue;
    }
    try {
      views.push(toView(pack, id, await pack.status()));
    } catch {
      // A pack that cannot report status is not usable; skip it rather than
      // failing the whole list.
    }
  }
  return views.sort((a, b) => a.zoomMax - b.zoomMax);
}

/** The widest zoom range any downloaded pack actually covers. */
export async function getOfflineCoverage(): Promise<{ zoomMin: number; zoomMax: number } | null> {
  const views = await getMapPackViews();
  return coverageFromPacks(views);
}

export async function isWifiOnlyDownloads(): Promise<boolean> {
  const value = await getSetting(WIFI_ONLY_SETTING_KEY);
  return value == null ? DEFAULT_WIFI_ONLY : value === '1';
}

export async function setWifiOnlyDownloads(enabled: boolean): Promise<void> {
  await saveSetting(WIFI_ONLY_SETTING_KEY, enabled ? '1' : '0');
}

function handleProgress(_pack: OfflinePack, _status: OfflinePackStatus): void {
  notify();
}

function handleError(pack: OfflinePack, error: OfflinePackError): void {
  const id = packIdOf(pack);
  if (id) {
    packErrors.set(id, error.message || 'دانلود ناموفق بود.');
    notify();
  }
}

/**
 * Ensures a pack satisfying `input` exists on disk, creating or replacing it as
 * needed. Returns a Persian refusal reason when the request cannot be satisfied.
 */
async function ensurePack(
  id: PackId,
  input: PlanInput,
  tierId: MapTierId | null,
): Promise<string | null> {
  const native = await findNative(id);
  const plan = planPackStart(id, input, native ? toExisting(native) : null);

  if (plan.action === 'skip') {
    return plan.reason;
  }
  if (plan.action === 'reuse') {
    if (native) {
      await resumePack(id, native);
    }
    return null;
  }

  // `OfflineManager` cannot widen a pack in place, so an outgrown pack is
  // replaced wholesale. Base → deep only saves the handful of z4–z10 tiles, so
  // the re-download is negligible next to the pack's real cost.
  if (native) {
    OfflineManager.removeListener(native.id);
    await OfflineManager.deletePack(native.id);
  }
  manuallyPaused.delete(id);
  networkPauseReasons.delete(id);
  packErrors.delete(id);

  await OfflineManager.createPack(
    {
      bounds: toLngLatBounds(plan.bounds),
      mapStyle: getAppConfig().mapStyleUrl,
      maxZoom: plan.zoomMax,
      metadata: {
        packId: id,
        zoomMax: plan.zoomMax,
        zoomMin: plan.zoomMin,
        ...(tierId ? { tierId } : {}),
      },
      minZoom: plan.zoomMin,
    },
    handleProgress,
    handleError,
  );
  notify();
  return null;
}

async function resumePack(id: PackId, pack: OfflinePack): Promise<void> {
  manuallyPaused.delete(id);
  networkPauseReasons.delete(id);
  packErrors.delete(id);
  try {
    await pack.resume();
  } catch {
    // A complete pack has nothing to resume; ignore.
  }
  notify();
}

/** Starts (or upgrades to) the national Iran pack at the requested tier. */
export async function startNationalDownload(tierId: MapTierId): Promise<void> {
  await ensurePack(NATIONAL_PACK_ID, { center: null, radiusKm: 0, tier: MAP_TIERS[tierId] }, tierId);
}

/**
 * Starts the org area pack at the officer's chosen radius.
 *
 * Returns a Persian reason instead of throwing when the officer's org has no
 * location — a Ghost/Manager/multi-org caller has no centre to derive a box
 * from, and silently falling back to the national pack would look like the area
 * download had succeeded.
 */
export async function startAreaDownload(
  center: CenterPoint | null,
  radiusKm: number,
): Promise<string | null> {
  return ensurePack(AREA_PACK_ID, { center, radiusKm, tier: AREA_TIER }, null);
}

/** Preset radii the offline maps screen offers for the area pack. */
export function areaRadiusPresets(): readonly { km: number; label: string }[] {
  return AREA_RADII_KM;
}

export async function pauseDownload(id: string): Promise<void> {
  const packId = asPackId(id);
  if (!packId) {
    return;
  }
  manuallyPaused.add(packId);
  networkPauseReasons.delete(packId);
  const pack = await findNative(packId);
  if (pack) {
    try {
      await pack.pause();
    } catch {
      // Already inactive; the flag above is what the UI reads.
    }
  }
  notify();
}

export async function resumeDownload(id: string): Promise<void> {
  const packId = asPackId(id);
  if (!packId) {
    return;
  }
  const pack = await findNative(packId);
  if (pack) {
    await resumePack(packId, pack);
  }
}

export async function removePack(id: string): Promise<void> {
  const packId = asPackId(id);
  if (!packId) {
    return;
  }
  const pack = await findNative(packId);
  if (pack) {
    OfflineManager.removeListener(pack.id);
    await OfflineManager.deletePack(pack.id);
  }
  manuallyPaused.delete(packId);
  networkPauseReasons.delete(packId);
  packErrors.delete(packId);
  notify();
}

/** Pauses active packs, or resumes those we paused, to match the radio. */
async function applyNetworkPolicy(): Promise<void> {
  let snapshot;
  try {
    snapshot = await getConnectivitySnapshot();
  } catch {
    return;
  }
  const wifiOnly = await isWifiOnlyDownloads();
  const offline = snapshot.status === 'offline';
  const cellularBlocked = snapshot.type === 'cellular' && wifiOnly;

  for (const pack of await OfflineManager.getPacks()) {
    const id = packIdOf(pack);
    if (!id || manuallyPaused.has(id)) {
      continue;
    }
    if (offline) {
      networkPauseReasons.set(id, OFFLINE_PAUSE_HINT);
      try {
        await pack.pause();
      } catch {
        // Already inactive.
      }
    } else if (cellularBlocked) {
      networkPauseReasons.set(id, CELLULAR_PAUSE_HINT);
      try {
        await pack.pause();
      } catch {
        // Already inactive.
      }
    } else if (networkPauseReasons.has(id)) {
      // Only system pauses auto-resume; a manual «توقف» stays paused.
      await resumePack(id, pack);
    }
  }
  notify();
}

/**
 * Starts watching connectivity so packs paused for the network resume on Wi-Fi.
 * Mirrors the old downloader, which is what makes "pause on cellular, continue
 * on Wi-Fi" work without the officer touching anything.
 */
export function startMapDownloadWatcher(): () => void {
  void applyNetworkPolicy();
  return subscribeToConnectivity(() => {
    void applyNetworkPolicy();
  });
}
