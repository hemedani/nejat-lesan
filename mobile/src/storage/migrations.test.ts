import { describe, expect, it } from 'vitest';

import {
  boundsFromPackRow,
  boundsToPackRow,
  CURRENT_DATABASE_VERSION,
  planMigration,
} from './migrations';

describe('database migration planning', () => {
  it('does nothing for an already-current database', () => {
    expect(planMigration(CURRENT_DATABASE_VERSION)).toEqual([]);
  });

  it('builds the base schema for a fresh install', () => {
    const sql = planMigration(0).join('\n');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS map_packs');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS drafts');
  });

  it('adds the area-pack bounds column to an existing install', () => {
    // A v2 device already has map_packs; CREATE TABLE IF NOT EXISTS silently
    // skips it, so the new column has to arrive via ALTER or the app throws
    // "no such column: bounds_json" the first time it saves an area pack.
    const sql = planMigration(2).join('\n');
    expect(sql).toContain('ALTER TABLE map_packs ADD COLUMN bounds_json');
  });

  it('does not re-add a column an older database already received', () => {
    expect(planMigration(1).join('\n')).toContain('ALTER TABLE map_packs ADD COLUMN bounds_json');
  });

  it('never issues the same ALTER twice in one plan', () => {
    const adds = planMigration(0).filter(statement => statement.includes('ADD COLUMN'));
    expect(new Set(adds).size).toBe(adds.length);
  });

  it('does not ALTER a fresh install, whose schema already has the column', () => {
    // Replaying the v3 ALTER after CREATE TABLE aborts the first launch with
    // "duplicate column name" — caught by running the plan against real sqlite.
    const sql = planMigration(0).join('\n');
    expect(sql).not.toContain('ADD COLUMN');
    expect(sql).toContain('bounds_json TEXT');
  });

  it('gives an officer who installed before this version a place to cache their org forms', () => {
    // A v3 device is exactly the officer this feature is for: they have a working
    // install and no cached forms. Without the table their download would fail on
    // the first tap, on the road, with no way to recover.
    const sql = planMigration(3).join('\n');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS offline_forms');
    expect(sql).toContain('PRIMARY KEY (scope, form_key)');
  });

  it('creates the offline forms table on a fresh install too', () => {
    // A fresh install never replays the step migrations, so a table that lives only
    // in STEP_MIGRATIONS would simply not exist for a new officer.
    expect(planMigration(0).join('\n')).toContain('CREATE TABLE IF NOT EXISTS offline_forms');
  });

  it('gives the officer somewhere to keep their own road for the offline map', () => {
    // The location picker draws the organization's road from local storage. Without
    // this table the first press of the prepare button writes to a table that does not
    // exist, and the officer finds out on the road with a blank overlay.
    const sql = planMigration(4).join('\n');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS org_road_geometry');
    expect(sql).toContain('organization_id TEXT PRIMARY KEY NOT NULL');
  });

  it('creates the road geometry table on a fresh install too', () => {
    expect(planMigration(0).join('\n')).toContain('CREATE TABLE IF NOT EXISTS org_road_geometry');
  });

  it('yields a plan that survives being replayed on a fresh database file', () => {
    const sql = planMigration(0).join('\n');
    expect(sql).not.toContain('DROP TABLE');
    expect(sql).not.toContain('ADD COLUMN');
  });
});

describe('area pack bounds row mapping', () => {
  const bounds = { minLat: 1, maxLat: 2, minLng: 3, maxLng: 4 };

  it('round-trips a bounds box', () => {
    expect(boundsFromPackRow(boundsToPackRow(bounds))).toEqual(bounds);
  });

  it('keeps the national pack, which has no bounds, as null', () => {
    expect(boundsToPackRow(null)).toBeNull();
    expect(boundsFromPackRow(null)).toBeNull();
  });

  it('drops a malformed bounds payload instead of poisoning a resume', () => {
    expect(boundsFromPackRow('{not json')).toBeNull();
    expect(boundsFromPackRow('{"minLat":1}')).toBeNull();
    expect(boundsFromPackRow('[1,2,3,4]')).toBeNull();
  });

  it('rejects an inverted or out-of-range box rather than iterating it', () => {
    expect(boundsFromPackRow(JSON.stringify({ minLat: 50, maxLat: 10, minLng: 1, maxLng: 2 }))).toBeNull();
    expect(boundsFromPackRow(JSON.stringify({ minLat: 1, maxLat: 200, minLng: 1, maxLng: 2 }))).toBeNull();
  });
});