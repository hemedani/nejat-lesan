import { File } from 'expo-file-system';

import { AREA_TIER, type CenterPoint } from '@/domain/map-area-pack';
import { coverageFromPacks, planPackStart, type PlanInput } from '@/domain/map-pack-plan';
import { AREA_RADII_KM } from '@/domain/map-area-pack';
import {
  MAP_TIERS,
  estimatePack,
  iterTiles,
  type GeoBounds,
  type MapTierId,
  type TileCoord,
} from '@/domain/map-packs';
import {
  cacheEmptyTile,
  clearEmptyTileCache,
  getLocalDatabase,
  getMapPack,
  getSetting,
  deleteMapPack,
  listMapPacks,
  saveMapPack,
  saveSetting,
} from '@/storage/local-database';
import { deleteAllTiles, downloadTile, measureTileMirror, tileLocalUri } from '@/services/map-tile-store';
import { getConnectivitySnapshot, subscribeToConnectivity } from '@/services/connectivity';

const WIFI_ONLY_SETTING_KEY = 'map_wifi_only';
export const DEFAULT_WIFI_ONLY = true;

const CONCURRENCY = 4;
const TILE_RETRY_DELAYS_MS = [1_000, 5_000, 15_000];
/** Give up the run after this many consecutive failed tiles (network down). */
const MAX_CONSECUTIVE_FAILURES = 8;
const PROGRESS_FLUSH_EVERY_TILES = 25;
const PROGRESS_FLUSH_EVERY_MS = 3_000;
const CELLULAR_PAUSE_HINT =
  'دانلود به دلیل فعال بودن گزینه «فقط وای‌فای» متوقف شد؛ با اتصال به وای‌فای ادامه می‌یابد.';
const OFFLINE_PAUSE_HINT = 'بدون اینترنت؛ دانلود نقشه پس از اتصال ادامه می‌یابد.';

export type MapPackView = {
  id: string;
  status: 'idle' | 'queued' | 'downloading' | 'paused' | 'done' | 'failed';
  tierId: MapTierId | null;
  zoomMin: number;
  zoomMax: number;
  tilesTotal: number;
  tilesDone: number;
  bytesDone: number;
  error?: string;
};

type Controls = { paused: boolean; removed: Set<string> };

let pumping = false;
let controls: Controls | null = null;
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

export async function isWifiOnlyDownloads(): Promise<boolean> {
  const value = await getSetting(WIFI_ONLY_SETTING_KEY);
  return value == null ? DEFAULT_WIFI_ONLY : value === '1';
}

export async function setWifiOnlyDownloads(enabled: boolean): Promise<void> {
  await saveSetting(WIFI_ONLY_SETTING_KEY, enabled ? '1' : '0');
}

function nowIso(): string {
  return new Date().toISOString();
}

function tierForZoomMax(zoomMax: number): MapTierId {
  return zoomMax >= MAP_TIERS.deep.zoomMax ? 'deep' : 'base';
}

function toView(pack: {
  bytes_done: number;
  error?: string;
  id: string;
  status: MapPackView['status'];
  tiles_done: number;
  tiles_total: number;
  zoom_max: number;
  zoom_min: number;
}): MapPackView {
  return {
    bytesDone: pack.bytes_done,
    error: pack.error,
    id: pack.id,
    status: pack.status,
    tierId: tierForZoomMax(pack.zoom_max),
    tilesDone: pack.tiles_done,
    tilesTotal: pack.tiles_total,
    zoomMax: pack.zoom_max,
    zoomMin: pack.zoom_min,
  };
}

/** Both packs, national first, for the offline maps screen. */
export async function getMapPackViews(): Promise<MapPackView[]> {
  const packs = await listMapPacks();
  return packs.map(toView);
}

/** The widest zoom range any downloaded pack actually covers. */
export async function getOfflineCoverage(): Promise<{ zoomMin: number; zoomMax: number } | null> {
  const packs = await listMapPacks();
  return coverageFromPacks(packs);
}

/**
 * Starts (or widens) the national Iran pack. Upgrading base -> deep only raises
 * `zoom_max`; already-downloaded tiles are kept and skipped.
 */
export async function startNationalDownload(tierId: MapTierId): Promise<void> {
  const tier = MAP_TIERS[tierId];
  const existing = await getMapPack('national');
  const timestamp = nowIso();
  const nextTilesTotal = estimatePack(tier).tilesTotal;

  if (existing && existing.zoom_max >= tier.zoomMax && existing.status !== 'failed') {
    await saveMapPack({ ...existing, error: undefined, status: 'queued', updated_at: timestamp });
  } else if (existing) {
    await saveMapPack({
      ...existing,
      error: undefined,
      status: 'queued',
      updated_at: timestamp,
      zoom_min: tier.zoomMin,
      zoom_max: tier.zoomMax,
      tiles_total: nextTilesTotal,
    });
  } else {
    await saveMapPack({
      bytes_done: 0,
      created_at: timestamp,
      error: undefined,
      id: 'national',
      status: 'queued',
      tiles_done: 0,
      tiles_total: nextTilesTotal,
      updated_at: timestamp,
      zoom_max: tier.zoomMax,
      zoom_min: tier.zoomMin,
    });
  }
  notify();
  void pump();
}

/**
 * Starts (or widens) the org area pack at z13..z17.
 *
 * Returns a Persian reason instead of throwing when the officer's org has no
 * location — a Ghost/Manager/multi-org caller has no centre to derive a box
 * from, and silently falling back to the national pack would look like the
 * area download had succeeded.
 */
export async function startAreaDownload(center: CenterPoint | null, radiusKm: number): Promise<string | null> {
  const input: PlanInput = { center, radiusKm, tier: AREA_TIER };
  const existing = await getMapPack('area');
  const plan = planPackStart('area', input, existing);
  if (plan.action === 'skip' || !plan.pack) {
    return plan.reason ?? 'دانلود محدوده ممکن نیست.';
  }
  await saveMapPack({ ...plan.pack, bounds: plan.pack.bounds ?? undefined });
  notify();
  void pump();
  return null;
}

/** Preset radii the offline maps screen offers for the area pack. */
export function areaRadiusPresets(): readonly { km: number; label: string }[] {
  return AREA_RADII_KM;
}

export async function pauseDownload(id: string): Promise<void> {
  if (controls) {
    controls.paused = true;
  }
  const pack = await getMapPack(id);
  if (pack && (pack.status === 'queued' || pack.status === 'downloading')) {
    await saveMapPack({ ...pack, status: 'paused', updated_at: nowIso() });
  }
  notify();
}

export async function resumeDownload(id: string): Promise<void> {
  if (controls) {
    controls.paused = false;
  }
  const pack = await getMapPack(id);
  if (pack && (pack.status === 'paused' || pack.status === 'failed')) {
    await saveMapPack({ ...pack, error: undefined, status: 'queued', updated_at: nowIso() });
  }
  notify();
  void pump();
}

export async function removePack(id: string): Promise<void> {
  if (controls) {
    controls.removed.add(id);
  }
  await clearEmptyTileCache(id);
  await deleteMapPack(id);
  // Tiles are a flat z/x/y mirror shared by every pack, so only a wholesale
  // removal may delete the mirror; dropping one pack leaves the files in place
  // and the other pack's counters recount them on the next run.
  if (id === 'national') {
    await deleteAllTiles();
  }
  notify();
}

async function shouldPauseForNetwork(): Promise<string | null> {
  try {
    const snapshot = await getConnectivitySnapshot();
    if (snapshot.status === 'offline') {
      return OFFLINE_PAUSE_HINT;
    }
    if (snapshot.type === 'cellular' && (await isWifiOnlyDownloads())) {
      return CELLULAR_PAUSE_HINT;
    }
  } catch {
    return OFFLINE_PAUSE_HINT;
  }
  return null;
}

async function flushCounters(id: string, tilesDone: number, bytesDone: number): Promise<void> {
  const pack = await getMapPack(id);
  if (!pack) {
    return;
  }
  await saveMapPack({
    ...pack,
    bytes_done: bytesDone,
    status: 'downloading',
    tiles_done: tilesDone,
    updated_at: nowIso(),
  });
}

/**
 * Yields the tiles a pack still needs.
 *
 * `visitAll` is built from the pack's own zoom range and bounds, so the area
 * pack only walks its own box. The national pack keeps its Iran-wide bounds.
 */
async function* pendingCoords(
  id: string,
  zoomMin: number,
  zoomMax: number,
  bounds: GeoBounds | null,
  emptyKeys: ReadonlySet<string>,
): AsyncGenerator<TileCoord> {
  const queue: TileCoord[] = [];
  iterTiles({ id: 'base', zoomMin, zoomMax }, tile => {
    queue.push(tile);
  }, bounds ?? undefined);
  for (const tile of queue) {
    let cached = false;
    try {
      cached = new File(tileLocalUri(tile)).exists;
    } catch {
      cached = false;
    }
    if (!cached && !emptyKeys.has(`${tile.z}/${tile.x}/${tile.y}`)) {
      yield tile;
    }
  }
  void id;
}

async function processOne(
  tile: TileCoord,
): Promise<{ outcome: 'ok'; bytes: number } | { outcome: 'empty' } | { outcome: 'retry' }> {
  for (let attempt = 0; attempt <= TILE_RETRY_DELAYS_MS.length; attempt += 1) {
    const result = await downloadTile(tile);
    if (result.outcome !== 'failed') {
      return result;
    }
    if (attempt < TILE_RETRY_DELAYS_MS.length) {
      await sleep(TILE_RETRY_DELAYS_MS[attempt]);
    }
  }
  return { outcome: 'retry' };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadEmptyKeySet(id: string): Promise<Set<string>> {
  const keys = new Set<string>();
  const database = await getLocalDatabase();
  const rows = await database.getAllAsync<{ z: number; x: number; y: number }>(
    "SELECT z, x, y FROM map_tiles WHERE pack_id = ? AND status = 'empty'",
    id,
  );
  for (const row of rows) {
    keys.add(`${row.z}/${row.x}/${row.y}`);
  }
  return keys;
}

async function runPack(id: string): Promise<'done' | 'stopped'> {
  const pack = await getMapPack(id);
  if (!pack) {
    return 'stopped';
  }

  const pauseReason = await shouldPauseForNetwork();
  if (pauseReason) {
    await saveMapPack({ ...pack, error: pauseReason, status: 'paused', updated_at: nowIso() });
    notify();
    return 'stopped';
  }

  // Recount from the filesystem so restarts, widenings and upgrade-only
  // changes all resume with exact numbers.
  const mirror = await measureTileMirror();
  const counters = { bytes: mirror.bytes, consecutiveFailures: 0, done: mirror.files };
  await flushCounters(id, counters.done, counters.bytes);

  const emptyKeys = await loadEmptyKeySet(id);
  const bounds = pack.bounds ?? null;
  const iterator = pendingCoords(id, pack.zoom_min, pack.zoom_max, bounds, emptyKeys);
  let lastFlushAt = Date.now();
  let lastFlushCount = counters.done;

  const worker = async (): Promise<void> => {
    while (!controls?.paused && !controls?.removed.has(id)) {
      const next = await iterator.next();
      if (next.done) {
        return;
      }
      const result = await processOne(next.value);
      if (result.outcome === 'ok') {
        counters.done += 1;
        counters.bytes += result.bytes;
        counters.consecutiveFailures = 0;
      } else if (result.outcome === 'empty') {
        await cacheEmptyTile(id, next.value.z, next.value.x, next.value.y);
        counters.done += 1;
        counters.consecutiveFailures = 0;
      } else {
        counters.consecutiveFailures += 1;
      }

      const due =
        counters.done - lastFlushCount >= PROGRESS_FLUSH_EVERY_TILES ||
        Date.now() - lastFlushAt >= PROGRESS_FLUSH_EVERY_MS;
      if (due) {
        lastFlushAt = Date.now();
        lastFlushCount = counters.done;
        await flushCounters(id, counters.done, counters.bytes);
        notify();
      }
      if (counters.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        controls!.paused = true;
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const fresh = await getMapPack(id);
  if (!fresh) {
    return 'stopped';
  }
  if (controls?.removed.has(id)) {
    return 'stopped';
  }
  if (controls?.paused) {
    const reason = await shouldPauseForNetwork();
    await saveMapPack({
      ...fresh,
      bytes_done: counters.bytes,
      error: reason ?? undefined,
      status: 'paused',
      tiles_done: counters.done,
      updated_at: nowIso(),
    });
    notify();
    return 'stopped';
  }

  await saveMapPack({
    ...fresh,
    bytes_done: counters.bytes,
    error: counters.consecutiveFailures > 0 ? 'ارسال بخشی از کاشی‌ها ناموفق بود؛ دوباره تلاش کنید.' : undefined,
    status: counters.consecutiveFailures > 0 ? 'failed' : 'done',
    tiles_done: counters.done,
    updated_at: nowIso(),
  });
  notify();
  return 'done';
}

/** Single-flight pump; safe to call repeatedly (start, connectivity change…). */
export async function pump(): Promise<void> {
  if (pumping) {
    return;
  }
  pumping = true;
  controls = { paused: false, removed: new Set() };
  try {
    // Recover force-killed runs.
    for (const stuck of await listMapPacks()) {
      if (stuck.status === 'downloading') {
        await saveMapPack({ ...stuck, status: 'queued', updated_at: nowIso() });
      }
    }
    while (!controls.paused) {
      const queued = (await listMapPacks()).filter(pack => pack.status === 'queued');
      if (queued.length === 0) {
        break;
      }
      // National first: it is the coarse pack every other one layers onto, and
      // finishing it means an interrupted area download still leaves a usable
      // country overview behind.
      const next = queued.sort((a, b) => a.zoom_max - b.zoom_max)[0];
      const result = await runPack(next.id);
      if (result === 'stopped') {
        break;
      }
    }
  } finally {
    pumping = false;
    controls = null;
    notify();
  }
}

/** Starts listening for connectivity so paused downloads auto-resume on Wi-Fi. */
export function startMapDownloadWatcher(): () => void {
  void pump();
  return subscribeToConnectivity(snapshot => {
    if (snapshot.status === 'offline') {
      return;
    }
    void (async () => {
      const cellularBlocked = snapshot.type === 'cellular' && (await isWifiOnlyDownloads());
      if (!cellularBlocked) {
        // Only system-set pauses (offline / Wi-Fi policy) auto-resume; a manual
        // «توقف» by the officer must stay paused.
        for (const pack of await listMapPacks()) {
          if (pack.status === 'paused' && (pack.error === CELLULAR_PAUSE_HINT || pack.error === OFFLINE_PAUSE_HINT)) {
            await saveMapPack({ ...pack, error: undefined, status: 'queued', updated_at: nowIso() });
          }
        }
      }
      void pump();
    })();
  });
}