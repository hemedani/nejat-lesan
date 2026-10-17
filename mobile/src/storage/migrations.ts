/**
 * Schema migrations, kept as plain SQL strings so the *decision* of which
 * statements to run is unit-testable without a device.
 *
 * The bounds column matters more than it looks: a v2 device already has
 * `map_packs`, and `CREATE TABLE IF NOT EXISTS` would silently skip it, so
 * without the ALTER the app throws "no such column: bounds_json" the first
 * time it saves an area pack — on an officer's phone, mid-field.
 */

import type { GeoBounds } from '@/domain/map-packs';

export const CURRENT_DATABASE_VERSION = 5;

/**
 * The organization's own forms, as stored on the device.
 *
 * Shared between the base schema and the v4 step, so a fresh install and an upgrade
 * end up with an identical table. `IF NOT EXISTS` makes replaying it harmless.
 */
const OFFLINE_FORMS_TABLE = `
    CREATE TABLE IF NOT EXISTS offline_forms (
      scope TEXT NOT NULL,
      form_key TEXT NOT NULL,
      name TEXT NOT NULL,
      form_kind TEXT,
      version INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      PRIMARY KEY (scope, form_key)
    );
`;

/**
 * The organization's own road, kept so the location picker can draw it without signal.
 *
 * One row per organization, because `organization.road` is a 1:1 relation — a freeway
 * org binds to exactly one road and a municipality org has none. A table keyed by road
 * id would imply an org can have several, and would leave the "which road is this
 * officer's" question open on a device that has to answer it offline.
 */
const ORG_ROAD_GEOMETRY_TABLE = `
    CREATE TABLE IF NOT EXISTS org_road_geometry (
      organization_id TEXT PRIMARY KEY NOT NULL,
      road_id TEXT NOT NULL,
      name TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
`;

const BASE_SCHEMA = `
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
    CREATE TABLE IF NOT EXISTS map_packs (
      id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      zoom_min INTEGER NOT NULL,
      zoom_max INTEGER NOT NULL,
      tiles_total INTEGER NOT NULL DEFAULT 0,
      tiles_done INTEGER NOT NULL DEFAULT 0,
      bytes_done INTEGER NOT NULL DEFAULT 0,
      bounds_json TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS map_tiles (
      pack_id TEXT NOT NULL,
      z INTEGER NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      status TEXT NOT NULL,
      size_bytes INTEGER,
      PRIMARY KEY (pack_id, z, x, y),
      FOREIGN KEY (pack_id) REFERENCES map_packs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS map_tiles_status ON map_tiles(pack_id, status);
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
` + OFFLINE_FORMS_TABLE
  + ORG_ROAD_GEOMETRY_TABLE;

/** v3 added the area pack's bounding box, stored as JSON. */
const V3_ADD_AREA_BOUNDS = 'ALTER TABLE map_packs ADD COLUMN bounds_json TEXT;';

/** v4 gave the device somewhere to keep the organization's own forms offline. */
const V4_ADD_OFFLINE_FORMS = OFFLINE_FORMS_TABLE;

/** v5 did the same for the organization's road, which the offline map draws. */
const V5_ADD_ORG_ROAD_GEOMETRY = ORG_ROAD_GEOMETRY_TABLE;

/** Ordered per-version upgrades; each runs only when the device is below it. */
const STEP_MIGRATIONS: Record<number, string[]> = {
  3: [V3_ADD_AREA_BOUNDS],
  4: [V4_ADD_OFFLINE_FORMS],
  5: [V5_ADD_ORG_ROAD_GEOMETRY],
};

export function planMigration(currentVersion: number): string[] {
  if (currentVersion >= CURRENT_DATABASE_VERSION) {
    return [];
  }
  // A fresh install gets the whole schema and no ALTER: BASE_SCHEMA already
  // creates map_packs with bounds_json, so running the v3 step afterwards would
  // abort the very first launch with "duplicate column name: bounds_json".
  if (currentVersion === 0) {
    return [BASE_SCHEMA];
  }
  const steps: string[] = [];
  for (let version = currentVersion + 1; version <= CURRENT_DATABASE_VERSION; version += 1) {
    steps.push(...(STEP_MIGRATIONS[version] ?? []));
  }
  return steps;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Serialises a bounds box for the `bounds_json` column. */
export function boundsToPackRow(bounds: GeoBounds | null): string | null {
  return bounds ? JSON.stringify(bounds) : null;
}

/**
 * Parses `bounds_json`, or `null` when it is absent, unparseable, or describes
 * a box that cannot be iterated.
 *
 * Null beats a throw here: a corrupt bounds string must degrade to "this pack
 * has no area" rather than abort the download pump and strand the national pack.
 */
export function boundsFromPackRow(raw: string | null | undefined): GeoBounds | null {
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const { minLat, maxLat, minLng, maxLng } = parsed as Record<string, unknown>;
  if (!isFiniteNumber(minLat) || !isFiniteNumber(maxLat) || !isFiniteNumber(minLng) || !isFiniteNumber(maxLng)) {
    return null;
  }
  if (minLat > maxLat || minLng > maxLng) {
    return null;
  }
  if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) {
    return null;
  }
  return { maxLat, maxLng, minLat, minLng };
}