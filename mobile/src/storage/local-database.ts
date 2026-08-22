import * as SQLite from 'expo-sqlite';

import type { AccidentDraft, SyncStatus } from '@/domain/types';

const DATABASE_NAME = 'lesen-mobile.db';
const DATABASE_VERSION = 1;

export type DraftRecord = AccidentDraft;

export type MediaRecord = {
  id: string;
  client_report_uuid: string;
  category: 'plate' | 'insurance' | 'croquis' | 'damage';
  local_uri: string;
  mime_type?: string;
  size_bytes?: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type QueueRecord = {
  id: string;
  client_report_uuid: string;
  status: SyncStatus;
  attempts: number;
  next_retry_at?: string;
  last_error?: string;
  updated_at: string;
};

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
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS drafts (
      client_report_uuid TEXT PRIMARY KEY NOT NULL,
      sync_status TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY NOT NULL,
      client_report_uuid TEXT NOT NULL,
      category TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_report_uuid) REFERENCES drafts(client_report_uuid) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      client_report_uuid TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      next_retry_at TEXT,
      last_error TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_report_uuid) REFERENCES drafts(client_report_uuid) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS references_cache (
      cache_key TEXT PRIMARY KEY NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
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
  return parseJson<DraftRecord>(row.payload_json);
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