import type { MediaRecord } from '@/storage/local-database';

/**
 * How far a captured asset has got on its way to the server.
 *
 * The bytes are captured offline-first: `attachAsset` writes them to the report's
 * media directory and the field answers with the local id. Uploading used to
 * happen only inside the sync worker, which meant an officer had no idea whether
 * their evidence would ever reach the centre until they opened the drafts list
 * and read a failure there. These states let the field itself show the truth —
 * and, more importantly, let the field offer a retry that is not "submit again".
 *
 * `uploaded` is never stored as a guess: it is only ever derived from a real
 * `server_file_id` the backend acknowledged. The state column records intent and
 * failure, so a row written by a build that never knew about this feature is
 * still read correctly.
 */
export type AssetUploadState = 'pending' | 'uploading' | 'uploaded' | 'failed';

export const ASSET_UPLOAD_STATE = {
  pending: 'pending',
  uploading: 'uploading',
  uploaded: 'uploaded',
  failed: 'failed',
} as const satisfies Record<AssetUploadState, AssetUploadState>;

/** What the officer sees under each file's name. */
export const ASSET_UPLOAD_LABEL: Record<AssetUploadState, string> = {
  pending: 'در انتظار ارسال',
  uploading: 'در حال ارسال…',
  uploaded: 'ارسال شد',
  failed: 'ارسال ناموفق',
};

function metadataOf(record: MediaRecord): Record<string, unknown> {
  return (record.metadata ?? {}) as Record<string, unknown>;
}

/** The server id, once the backend has acknowledged the upload. */
export function serverFileIdOf(record: MediaRecord): string | undefined {
  const value = metadataOf(record)['server_file_id'];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * The state to render, resolved so the acknowledgement always wins.
 *
 * `server_file_id` is the only authority: a row can claim `failed` from a failed
 * attempt and `pending` from a restart, but once the id is stored the upload is
 * done and no later write may talk the field out of it.
 */
export function uploadStateOf(record: MediaRecord): AssetUploadState {
  if (serverFileIdOf(record) !== undefined) {
    return ASSET_UPLOAD_STATE.uploaded;
  }
  const value = metadataOf(record)['upload_state'];
  if (
    value === ASSET_UPLOAD_STATE.uploading ||
    value === ASSET_UPLOAD_STATE.failed ||
    value === ASSET_UPLOAD_STATE.pending
  ) {
    return value;
  }
  return ASSET_UPLOAD_STATE.pending;
}

/** Why the last attempt failed, for the field's status line. Empty when there is none. */
export function uploadErrorOf(record: MediaRecord): string {
  const value = metadataOf(record)['upload_error'];
  return typeof value === 'string' ? value : '';
}

/** True while an upload is worth offering as a button rather than a spinner. */
export function canRetryUpload(record: MediaRecord): boolean {
  const state = uploadStateOf(record);
  return state === ASSET_UPLOAD_STATE.failed || state === ASSET_UPLOAD_STATE.pending;
}

/** The metadata patch that marks the start of an attempt. */
export function beginUploadPatch(): Record<string, unknown> {
  return {
    upload_state: ASSET_UPLOAD_STATE.uploading,
    upload_error: '',
  };
}

/** The metadata patch that records a successful upload. */
export function succeedUploadPatch(serverFileId: string): Record<string, unknown> {
  return {
    upload_state: ASSET_UPLOAD_STATE.uploaded,
    upload_error: '',
    server_file_id: serverFileId,
  };
}

/** The metadata patch that records a failed attempt, leaving any prior id intact. */
export function failUploadPatch(message: string): Record<string, unknown> {
  return {
    upload_state: ASSET_UPLOAD_STATE.failed,
    upload_error: message,
  };
}
