import type { AnswerValue } from '@forms';

/**
 * Rewriting captured assets into the report payload.
 *
 * A dynamic form's `file` field answers with the **local** ids of the assets the
 * officer captured, because the bytes live on the device and the field has to
 * survive navigation and restart before any upload happens. The server, of
 * course, knows nothing of those ids — it issued its own when each file arrived.
 *
 * So at submit time every local id has to be swapped for the server's file id,
 * everywhere it appears: the raw `form_answers` tree, the flattened
 * `dynamic_answers` rows, and any typed key a bound field projected onto. Doing
 * it as a walk of the whole payload is what makes those three stay consistent —
 * resolving them one at a time would let a bound copy keep the local id.
 *
 * The same walk is not enough for a `file` field's row, though. Swapping the ids
 * there leaves a row whose only content is opaque ObjectIds, so the review screen
 * would list hex instead of `photo-1234.jpg`. `splitAssetAnswerRows` therefore
 * separates the two: the server ids go to `answer_ids` (joinable, and the only
 * column the schema types as ObjectId) and the filenames to `answer_names` (the
 * column the panel renders).
 *
 * Pure and dependency-free, so the mapping rules are unit-testable without a
 * device or a backend.
 */

/** local asset id → server file id, for the assets that uploaded successfully. */
export type AssetIdMap = Record<string, string>;

/**
 * server file id → the name to show for it.
 *
 * Keyed by the **server** id, not the local one, because by the time a row is
 * rewritten the local id is already gone — and a re-sync of an already-resolved
 * row only ever sees server ids.
 */
export type AssetNameMap = Record<string, string>;

/**
 * The prefix `asset-service` gives every locally captured asset.
 *
 * Local ids are matched by this prefix rather than by a lookup miss so that an
 * id from a *different* report — or a plain string answer that happens to look
 * like one — is never rewritten by accident.
 */
export const LOCAL_ASSET_PREFIX = 'asset-';

export const isLocalAssetId = (value: string): boolean =>
  value.startsWith(LOCAL_ASSET_PREFIX);

/**
 * Replace local asset ids with server file ids throughout a value.
 *
 * A local id with no mapping is left untouched: it is not this function's job to
 * decide whether that is an error, and silently dropping it here would hide the
 * fact that a file never reached the server.
 */
export function resolveAssetIds(value: AnswerValue, mapping: AssetIdMap): AnswerValue {
  if (typeof value === 'string') {
    if (isLocalAssetId(value) && mapping[value] !== undefined) {
      return mapping[value];
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => resolveAssetIds(entry, mapping));
  }
  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, AnswerValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      resolved[key] = resolveAssetIds(entry as AnswerValue, mapping);
    }
    return resolved;
  }
  return value;
}

/**
 * Resolve a whole draft payload.
 *
 * Returns the input unchanged when there is nothing to resolve, so an ordinary
 * report (no assets at all) does not get a needless deep copy on every sync.
 */
export function resolveAssetIdsInData(
  data: Record<string, unknown>,
  mapping: AssetIdMap,
): Record<string, unknown> {
  if (Object.keys(mapping).length === 0) {
    return data;
  }
  return resolveAssetIds(data as AnswerValue, mapping) as Record<string, unknown>;
}

export type AssetAnswerSplit = {
  /** `dynamic_answers` with every file row's ids separated from its names. */
  rows: unknown;
  /**
   * The server file ids the answers actually reference, in first-seen order.
   *
   * Taken from the rows rather than from the upload mapping: a file the officer
   * captured and then removed from the field is still in the mapping, and
   * linking it would put a phantom tile in the report's gallery.
   */
  attachmentIds: string[];
};

/**
 * Give a `file` field's answer row a readable shape.
 *
 * `buildDynamicAnswers` snapshots a `file` answer the way it snapshots any other
 * multi-value — the list in `answer_names` — because that is the only list
 * column a plain string answer has. For a file field those strings are asset
 * ids, so the row reaches the review screen as `asset-1791356903221-aqqdvv` or,
 * once uploaded, as a bare ObjectId.
 *
 * A row is treated as a file answer only when **every** entry is one of this
 * report's files — either a local id still awaiting upload, or the server id an
 * earlier sync already wrote back. A literal option label or a reference id
 * fails that test, which is what keeps choice and reference answers out; and a
 * row already rewritten (names, not ids) matches nothing, so a re-sync leaves it
 * alone.
 *
 * Ids are never invented: a row with even one entry that cannot be resolved is
 * returned untouched, and `resolveAssetIdsInData` then does what it always did.
 * That ordering matters — `answer_ids` is typed `objectIdValidation` server-side,
 * so writing an unresolved `asset-…` id into it would fail validation and take
 * the whole report down with it.
 */
export function splitAssetAnswerRows(
  rows: unknown,
  ids: AssetIdMap,
  names: AssetNameMap,
): AssetAnswerSplit {
  const untouched: AssetAnswerSplit = { rows, attachmentIds: [] };
  if (!Array.isArray(rows)) {
    return untouched;
  }

  const serverIds = new Set(Object.values(ids));
  const attachmentIds: string[] = [];
  let changed = false;

  const rewritten = rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return row;
    }
    const record = row as Record<string, unknown>;
    const entries = record['answer_names'];
    if (!Array.isArray(entries) || entries.length === 0) {
      return row;
    }

    const resolved: string[] = [];
    for (const entry of entries) {
      if (typeof entry !== 'string') {
        return row;
      }
      const serverId = ids[entry];
      if (serverId !== undefined) {
        resolved.push(serverId);
      } else if (serverIds.has(entry)) {
        resolved.push(entry);
      } else {
        return row;
      }
    }

    changed = true;
    for (const serverId of resolved) {
      if (!attachmentIds.includes(serverId)) {
        attachmentIds.push(serverId);
      }
    }

    return {
      ...record,
      answer_ids: resolved,
      // A name we never saw falls back to the id: an unreadable row is still
      // better than a blank one, and the fallback is visible in the payload.
      answer_names: resolved.map((serverId) => names[serverId] ?? serverId),
    };
  });

  return changed ? { rows: rewritten, attachmentIds } : untouched;
}
