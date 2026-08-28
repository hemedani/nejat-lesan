import { File } from 'expo-file-system';

import {
  MAP_TIERS,
  estimatePack,
  iterTiles,
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
  saveMapPack,
  saveSetting,
} from '@/storage/local-database';
import {
  deleteAllTiles,
  downloadTile,
  measureTileMirror,
  tileLocalUri,
} from '@/services/map-tile-store';
import {
  getConnectivitySnapshot,
  subscribeToConnectivity,
} from '@/services/connectivity';

export const NATIONAL_PACK_ID = 'national';
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
  zoomMax: number;
  tierId: MapTierId | null;
  tilesTotal: number;
  tilesDone: number;
  bytesDone: number;
  error?: string;
};

type Controls = { paused: boolean; removed: boolean };

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

export async function getNationalPack(): Promise<MapPackView | null> {
  const pack = await getMapPack(NATIONAL_PACK_ID);
  if (!pack) {
    return null;
  }
  return {
    bytesDone: pack.bytes_done,
    error: pack.error,
    id: pack.id,
    status: pack.status,
    tierId: tierForZoomMax(pack.zoom_max),
    tilesDone: pack.tiles_done,
    tilesTotal: pack.tiles_total,
    zoomMax: pack.zoom_max,
  };
}

/**
 * Starts (or upgrades) the single national Iran pack. Upgrading from base to
 * deep only raises `zoom_max` — already-downloaded tiles are kept and skipped.
 */
export async function startNationalDownload(tierId: MapTierId): Promise<void> {
  const tier = MAP_TIERS[tierId];
  const existing = await getMapPack(NATIONAL_PACK_ID);
  const timestamp = nowIso();
  const nextTilesTotal = estimatePack(tier).tilesTotal;

  if (existing && existing.zoom_max >= tier.zoomMax && existing.status !== 'failed') {
    // Already requested at this depth; just requeue.
    await saveMapPack({ ...existing, status: 'queued', error: undefined, updated_at: timestamp });
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
      id: NATIONAL_PACK_ID,
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

export async function pauseNationalDownload(): Promise<void> {
  if (controls) {
    controls.paused = true;
  }
  const pack = await getMapPack(NATIONAL_PACK_ID);
  if (pack && (pack.status === 'queued' || pack.status === 'downloading')) {
    await saveMapPack({ ...pack, status: 'paused', updated_at: nowIso() });
  }
  notify();
}

export async function resumeNationalDownload(): Promise<void> {
  if (controls) {
    controls.paused = false;
  }
  const pack = await getMapPack(NATIONAL_PACK_ID);
  if (pack && (pack.status === 'paused' || pack.status === 'failed')) {
    await saveMapPack({
      ...pack,
      error: undefined,
      status: 'queued',
      updated_at: nowIso(),
    });
  }
  notify();
  void pump();
}

export async function removeNationalPack(): Promise<void> {
  if (controls) {
    controls.removed = true;
  }
  await clearEmptyTileCache(NATIONAL_PACK_ID);
  await deleteMapPack(NATIONAL_PACK_ID);
  await deleteAllTiles();
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

async function flushCounters(tilesDone: number, bytesDone: number): Promise<void> {
  const pack = await getMapPack(NATIONAL_PACK_ID);
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

async function* pendingCoords(
  zoomMin: number,
  zoomMax: number,
  emptyKeys: ReadonlySet<string>,
): AsyncGenerator<TileCoord> {
  const queue: TileCoord[] = [];
  iterTiles({ id: 'base', zoomMin, zoomMax }, tile => {
    queue.push(tile);
  });
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

async function loadEmptyKeySet(): Promise<Set<string>> {
  const keys = new Set<string>();
  const database = await getLocalDatabase();
  const rows = await database.getAllAsync<{ z: number; x: number; y: number }>(
    "SELECT z, x, y FROM map_tiles WHERE pack_id = ? AND status = 'empty'",
    NATIONAL_PACK_ID,
  );
  for (const row of rows) {
    keys.add(`${row.z}/${row.x}/${row.y}`);
  }
  return keys;
}

async function runPack(): Promise<'done' | 'stopped'> {
  const pack = await getMapPack(NATIONAL_PACK_ID);
  if (!pack) {
    return 'stopped';
  }

  const pauseReason = await shouldPauseForNetwork();
  if (pauseReason) {
    await saveMapPack({ ...pack, error: pauseReason, status: 'paused', updated_at: nowIso() });
    notify();
    return 'stopped';
  }

  // Recount from the filesystem so restarts/upgrades resume with exact numbers.
  const mirror = await measureTileMirror();
  const counters = { bytes: mirror.bytes, consecutiveFailures: 0, done: mirror.files };
  await flushCounters(counters.done, counters.bytes);

  const emptyKeys = await loadEmptyKeySet();
  const iterator = pendingCoords(pack.zoom_min, pack.zoom_max, emptyKeys);
  let lastFlushAt = Date.now();
  let lastFlushCount = counters.done;

  const worker = async (): Promise<void> => {
    while (!controls?.paused && !controls?.removed) {
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
        await cacheEmptyTile(NATIONAL_PACK_ID, next.value.z, next.value.x, next.value.y);
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
        await flushCounters(counters.done, counters.bytes);
        notify();
      }
      if (counters.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        controls!.paused = true;
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const fresh = await getMapPack(NATIONAL_PACK_ID);
  if (!fresh) {
    return 'stopped';
  }
  if (controls?.removed) {
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
    error: counters.consecutiveFailures > 0
      ? 'ارسال بخشی از کاشی‌ها ناموفق بود؛ دوباره تلاش کنید.'
      : undefined,
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
  controls = { paused: false, removed: false };
  try {
    // Recover a force-killed run.
    const stuck = await getMapPack(NATIONAL_PACK_ID);
    if (stuck && stuck.status === 'downloading') {
      await saveMapPack({ ...stuck, status: 'queued', updated_at: nowIso() });
    }
    while (!controls.paused && !controls.removed) {
      const pack = await getMapPack(NATIONAL_PACK_ID);
      if (!pack || pack.status !== 'queued') {
        break;
      }
      const result = await runPack();
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
        const pack = await getMapPack(NATIONAL_PACK_ID);
        // Only system-set pauses (offline / Wi-Fi policy) auto-resume;
        // a manual «توقف» by the officer must stay paused.
        if (
          pack?.status === 'paused' &&
          (pack.error === CELLULAR_PAUSE_HINT || pack.error === OFFLINE_PAUSE_HINT)
        ) {
          await saveMapPack({ ...pack, error: undefined, status: 'queued', updated_at: nowIso() });
        }
      }
      void pump();
    })();
  });
}
