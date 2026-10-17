import * as SQLite from 'expo-sqlite';

import type { GeoBounds } from '@/domain/map-packs';
import type { AccidentDraft, QueueRecord, SyncStatus } from '@/domain/types';
import { boundsFromPackRow, boundsToPackRow, CURRENT_DATABASE_VERSION, planMigration } from './migrations';
import { parseOfflineFormRow, type OfflineFormEntry, type OfflineFormRow, type OfflineFormScope } from '@/domain/offline-forms';

const DATABASE_NAME = 'lesen-mobile.db';

export type DraftRecord = AccidentDraft;

/**
 * A locally captured file attached to a report.
 *
 * `category` covers the accident wizard's fixed media slots (`plate`,
 * `insurance`, `croquis`, `damage`, `incident`) plus `asset`, which is the slot
 * used by a dynamic form's `file` fields — those can carry photos, videos and
 * documents, so they are not interchangeable with an accident photo slot.
 */
export type MediaRecord = {
  id: string;
  client_report_uuid: string;
  category: 'plate' | 'insurance' | 'croquis' | 'damage' | 'incident' | 'asset';
  local_uri: string;
  mime_type?: string;
  size_bytes?: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

/**
 * `idle` is a pack that was planned but never started. It matters because a
 * pack that has downloaded nothing must not contribute to the map's coverage —
 * honouring it would clamp the map to tiles that are not on disk.
 */
export type MapPackStatus = 'idle' | 'queued' | 'downloading' | 'paused' | 'done' | 'failed';

export type MapPackRecord = {
  id: string; // 'national' (whole of Iran) or 'area' (the officer's org box)
  status: MapPackStatus;
  zoom_min: number;
  zoom_max: number;
  tiles_total: number;
  tiles_done: number;
  bytes_done: number;
  /** `null` for the national pack, which has no box. */
  bounds?: GeoBounds;
  error?: string;
  created_at: string;
  updated_at: string;
};

export type { QueueRecord };

type DraftRow = {
  client_report_uuid: string;
  sync_status: SyncStatus;
  payload_json: string;
  updated_at: string;
};

type MediaRow = Omit<MediaRecord, 'metadata'> & { metadata_json: string };

type QueueRow = QueueRecord;

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

async function migrateDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;
  const steps = planMigration(currentVersion);
  if (steps.length === 0) {
    return;
  }
  for (const step of steps) {
    await database.execAsync(step);
  }
  // `CURRENT_DATABASE_VERSION` rather than a local constant: a plan that does
  // not advance the version replays itself on every launch, which is exactly
  // the "duplicate column" crash the migration planner exists to avoid.
  await database.execAsync(`PRAGMA user_version = ${CURRENT_DATABASE_VERSION}`);
}

export async function getLocalDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME).then(async database => {
    await migrateDatabase(database);
    return database;
  });
  return databasePromise;
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function toDraft(row: DraftRow): DraftRecord {
  const draft = parseJson<DraftRecord>(row.payload_json);
  return { ...draft, schema_version: draft.schema_version ?? 1 };
}

function toMedia(row: MediaRow): MediaRecord {
  return {
    ...row,
    metadata: parseJson<Record<string, unknown>>(row.metadata_json),
  };
}

export async function saveDraft(draft: DraftRecord): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync(
    `INSERT INTO drafts (client_report_uuid, sync_status, payload_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(client_report_uuid) DO UPDATE SET
       sync_status = excluded.sync_status,
       payload_json = excluded.payload_json,
       updated_at = excluded.updated_at`,
    draft.client_report_uuid,
    draft.sync_status,
    JSON.stringify(draft),
    draft.updated_at,
  );
}

export async function getDraft(clientReportUuid: string): Promise<DraftRecord | null> {
  const database = await getLocalDatabase();
  const row = await database.getFirstAsync<DraftRow>(
    'SELECT client_report_uuid, sync_status, payload_json, updated_at FROM drafts WHERE client_report_uuid = ?',
    clientReportUuid,
  );
  return row ? toDraft(row) : null;
}

export async function listDrafts(): Promise<DraftRecord[]> {
  const database = await getLocalDatabase();
  const rows = await database.getAllAsync<DraftRow>(
    'SELECT client_report_uuid, sync_status, payload_json, updated_at FROM drafts ORDER BY updated_at DESC',
  );
  return rows.map(toDraft);
}

export async function saveMedia(media: MediaRecord): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync(
    `INSERT INTO media (id, client_report_uuid, category, local_uri, mime_type, size_bytes, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       local_uri = excluded.local_uri,
       mime_type = excluded.mime_type,
       size_bytes = excluded.size_bytes,
       metadata_json = excluded.metadata_json`,
    media.id,
    media.client_report_uuid,
    media.category,
    media.local_uri,
    media.mime_type ?? null,
    media.size_bytes ?? null,
    JSON.stringify(media.metadata),
    media.created_at,
  );
}

export async function listMedia(clientReportUuid: string): Promise<MediaRecord[]> {
  const database = await getLocalDatabase();
  const rows = await database.getAllAsync<MediaRow>(
    'SELECT id, client_report_uuid, category, local_uri, mime_type, size_bytes, metadata_json, created_at FROM media WHERE client_report_uuid = ? ORDER BY created_at',
    clientReportUuid,
  );
  return rows.map(toMedia);
}

export async function deleteMedia(id: string): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync('DELETE FROM media WHERE id = ?', id);
}

export async function updateMediaUri(
  id: string,
  localUri: string,
  sizeBytes?: number,
): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync(
    'UPDATE media SET local_uri = ?, size_bytes = COALESCE(?, size_bytes) WHERE id = ?',
    localUri,
    sizeBytes ?? null,
    id,
  );
}

/** Merges a patch into a media record's metadata JSON (e.g. server_file_id after upload). */
export async function updateMediaMetadata(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const database = await getLocalDatabase();
  const row = await database.getFirstAsync<Pick<MediaRow, 'metadata_json'>>(
    'SELECT metadata_json FROM media WHERE id = ?',
    id,
  );
  if (!row) {
    return;
  }
  const metadata = { ...parseJson<Record<string, unknown>>(row.metadata_json), ...patch };
  await database.runAsync('UPDATE media SET metadata_json = ? WHERE id = ?', JSON.stringify(metadata), id);
}

export async function saveQueueRecord(record: QueueRecord): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync(
    `INSERT INTO sync_queue (id, client_report_uuid, status, attempts, next_retry_at, last_error, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       attempts = excluded.attempts,
       next_retry_at = excluded.next_retry_at,
       last_error = excluded.last_error,
       updated_at = excluded.updated_at`,
    record.id,
    record.client_report_uuid,
    record.status,
    record.attempts,
    record.next_retry_at ?? null,
    record.last_error ?? null,
    record.updated_at,
  );
}

export async function listQueueRecords(status?: SyncStatus): Promise<QueueRecord[]> {
  const database = await getLocalDatabase();
  if (status) {
    return database.getAllAsync<QueueRow>(
      'SELECT id, client_report_uuid, status, attempts, next_retry_at, last_error, updated_at FROM sync_queue WHERE status = ? ORDER BY updated_at',
      status,
    );
  }
  return database.getAllAsync<QueueRow>(
    'SELECT id, client_report_uuid, status, attempts, next_retry_at, last_error, updated_at FROM sync_queue ORDER BY updated_at',
  );
}

export async function saveReferenceCache(
  cacheKey: string,
  payload: unknown,
  updatedAt: string,
): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync(
    `INSERT INTO references_cache (cache_key, payload_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
       payload_json = excluded.payload_json,
       updated_at = excluded.updated_at`,
    cacheKey,
    JSON.stringify(payload),
    updatedAt,
  );
}

export async function getReferenceCache<T>(cacheKey: string): Promise<{ payload: T; updated_at: string } | null> {
  const database = await getLocalDatabase();
  const row = await database.getFirstAsync<{ payload_json: string; updated_at: string }>(
    'SELECT payload_json, updated_at FROM references_cache WHERE cache_key = ?',
    cacheKey,
  );
  return row ? { payload: parseJson<T>(row.payload_json), updated_at: row.updated_at } : null;
}

// ---------------------------------------------------------------------------
// The organization's own forms, kept for offline use
// ---------------------------------------------------------------------------
//
// The SQL lives here with the rest of it; `domain/offline-forms` owns the row mapping
// and every decision about those rows, because expo-sqlite cannot run under vitest.

function toOfflineForm(row: OfflineFormRow): OfflineFormEntry | null {
  return parseOfflineFormRow(row);
}

/**
 * Replace the stored copy of each given form.
 *
 * One transaction for the whole set: a download that wrote half its forms before
 * failing would leave the officer with a cache that claims a form is present and then
 * renders it empty.
 */
export async function saveOfflineForms(entries: readonly OfflineFormEntry[]): Promise<void> {
  if (entries.length === 0) {
    return;
  }
  const database = await getLocalDatabase();
  await database.withTransactionAsync(async () => {
    for (const entry of entries) {
      await database.runAsync(
        `INSERT INTO offline_forms (scope, form_key, name, form_kind, version, payload_json, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(scope, form_key) DO UPDATE SET
           name = excluded.name,
           form_kind = excluded.form_kind,
           version = excluded.version,
           payload_json = excluded.payload_json,
           fetched_at = excluded.fetched_at`,
        entry.scope,
        entry.form_key,
        entry.name,
        entry.form_kind ?? null,
        entry.version,
        JSON.stringify(entry.payload),
        entry.fetched_at,
      );
    }
  });
}

/** Every stored form of one kind. A row that cannot be read is left out, not fatal. */
export async function listOfflineForms(scope: OfflineFormScope): Promise<OfflineFormEntry[]> {
  const database = await getLocalDatabase();
  const rows = await database.getAllAsync<OfflineFormRow>(
    'SELECT scope, form_key, name, form_kind, version, payload_json, fetched_at FROM offline_forms WHERE scope = ?',
    scope,
  );
  return rows
    .map(toOfflineForm)
    .filter((entry): entry is OfflineFormEntry => entry !== null);
}

/** One stored form, or `null` when it was never downloaded or cannot be read. */
export async function getOfflineForm(
  scope: OfflineFormScope,
  formKey: string,
): Promise<OfflineFormEntry | null> {
  const database = await getLocalDatabase();
  const row = await database.getFirstAsync<OfflineFormRow>(
    'SELECT scope, form_key, name, form_kind, version, payload_json, fetched_at FROM offline_forms WHERE scope = ? AND form_key = ?',
    scope,
    formKey,
  );
  return row ? toOfflineForm(row) : null;
}

/**
 * Drop forms the organization no longer publishes.
 *
 * Only ever called with the full set a completed download returned, so an
 * interrupted download can never prune forms it merely failed to ask about.
 */
export async function deleteOfflineForms(scope: OfflineFormScope, keys: readonly string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }
  const database = await getLocalDatabase();
  await database.withTransactionAsync(async () => {
    for (const key of keys) {
      await database.runAsync('DELETE FROM offline_forms WHERE scope = ? AND form_key = ?', scope, key);
    }
  });
}

// ---------------------------------------------------------------------------
// Offline map packs
// ---------------------------------------------------------------------------

type MapPackRow = MapPackRecord & { bounds_json?: string | null };

function toMapPack(row: MapPackRow): MapPackRecord {
  const bounds = boundsFromPackRow(row.bounds_json);
  return { ...row, bounds: bounds ?? undefined, error: row.error ?? undefined };
}

export async function listMapPacks(): Promise<MapPackRecord[]> {
  const database = await getLocalDatabase();
  const rows = await database.getAllAsync<MapPackRow>('SELECT * FROM map_packs ORDER BY zoom_max');
  return rows.map(toMapPack);
}

export async function getMapPack(id: string): Promise<MapPackRecord | null> {
  const database = await getLocalDatabase();
  const row = await database.getFirstAsync<MapPackRow>('SELECT * FROM map_packs WHERE id = ?', id);
  return row ? toMapPack(row) : null;
}

export async function saveMapPack(pack: MapPackRecord): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync(
    `INSERT INTO map_packs (id, status, zoom_min, zoom_max, tiles_total, tiles_done, bytes_done, bounds_json, error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       zoom_min = excluded.zoom_min,
       zoom_max = excluded.zoom_max,
       tiles_total = excluded.tiles_total,
       tiles_done = excluded.tiles_done,
       bytes_done = excluded.bytes_done,
       bounds_json = excluded.bounds_json,
       error = excluded.error,
       updated_at = excluded.updated_at`,
    pack.id,
    pack.status,
    pack.zoom_min,
    pack.zoom_max,
    pack.tiles_total,
    pack.tiles_done,
    pack.bytes_done,
    boundsToPackRow(pack.bounds ?? null),
    pack.error ?? null,
    pack.created_at,
    pack.updated_at,
  );
}

export async function deleteMapPack(id: string): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync('DELETE FROM map_tiles WHERE pack_id = ?', id);
  await database.runAsync('DELETE FROM map_packs WHERE id = ?', id);
}

/** Negative cache for tiles that legitimately have no raster (sea, Caspian…). */
export async function isEmptyTileCached(
  packId: string,
  z: number,
  x: number,
  y: number,
): Promise<boolean> {
  const database = await getLocalDatabase();
  const row = await database.getFirstAsync<{ status: string }>(
    'SELECT status FROM map_tiles WHERE pack_id = ? AND z = ? AND x = ? AND y = ?',
    packId,
    z,
    x,
    y,
  );
  return row?.status === 'empty';
}

export async function cacheEmptyTile(packId: string, z: number, x: number, y: number): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync(
    `INSERT INTO map_tiles (pack_id, z, x, y, status) VALUES (?, ?, ?, ?, 'empty')
     ON CONFLICT(pack_id, z, x, y) DO UPDATE SET status = 'empty'`,
    packId,
    z,
    x,
    y,
  );
}

export async function clearEmptyTileCache(packId: string): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync("DELETE FROM map_tiles WHERE pack_id = ? AND status = 'empty'", packId);
}

// ---------------------------------------------------------------------------
// App settings (tiny key-value store)
// ---------------------------------------------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  const database = await getLocalDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    new Date().toISOString(),
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const database = await getLocalDatabase();
  await database.runAsync('DELETE FROM app_settings WHERE key = ?', key);
}