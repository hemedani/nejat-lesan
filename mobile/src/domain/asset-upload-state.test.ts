import { describe, expect, it } from 'vitest';

import {
  ASSET_UPLOAD_STATE,
  beginUploadPatch,
  canRetryUpload,
  failUploadPatch,
  serverFileIdOf,
  succeedUploadPatch,
  uploadErrorOf,
  uploadStateOf,
} from './asset-upload-state';
import type { MediaRecord } from '@/storage/local-database';

function record(metadata: Record<string, unknown>): MediaRecord {
  return {
    id: 'asset-1-abcdef',
    client_report_uuid: 'report-1',
    category: 'asset',
    local_uri: 'file:///media/report-1/asset-1-abcdef.jpg',
    mime_type: 'image/jpeg',
    size_bytes: 1024,
    metadata,
    created_at: '2026-10-12T00:00:00.000Z',
  };
}

describe('uploadStateOf', () => {
  it('treats a row with no metadata as pending, not as uploaded', () => {
    expect(uploadStateOf(record({}))).toBe(ASSET_UPLOAD_STATE.pending);
  });

  it('reads a recorded state', () => {
    expect(uploadStateOf(record({ upload_state: 'failed' }))).toBe(ASSET_UPLOAD_STATE.failed);
    expect(uploadStateOf(record({ upload_state: 'uploading' }))).toBe(ASSET_UPLOAD_STATE.uploading);
  });

  it('ignores a state it does not recognise', () => {
    expect(uploadStateOf(record({ upload_state: 'sent' }))).toBe(ASSET_UPLOAD_STATE.pending);
  });

  // The invariant that makes retry safe: an acknowledgement is the only proof the
  // server holds the bytes, so no later write may talk the field out of it.
  it('lets the server acknowledgement outrank any recorded state', () => {
    const acknowledged = record({ upload_state: 'failed', server_file_id: '6acdd8d8' });
    expect(uploadStateOf(acknowledged)).toBe(ASSET_UPLOAD_STATE.uploaded);
    expect(serverFileIdOf(acknowledged)).toBe('6acdd8d8');
    expect(canRetryUpload(acknowledged)).toBe(false);
  });

  it('does not treat a blank server id as an acknowledgement', () => {
    expect(uploadStateOf(record({ server_file_id: '' }))).toBe(ASSET_UPLOAD_STATE.pending);
    expect(serverFileIdOf(record({ server_file_id: '' }))).toBeUndefined();
  });
});

describe('canRetryUpload', () => {
  it('offers a retry for what has not reached the server', () => {
    expect(canRetryUpload(record({}))).toBe(true);
    expect(canRetryUpload(record({ upload_state: 'failed' }))).toBe(true);
  });

  it('never offers a retry while the upload is in flight', () => {
    expect(canRetryUpload(record({ upload_state: 'uploading' }))).toBe(false);
  });
});

describe('upload patches', () => {
  it('carries the server id on success', () => {
    expect(succeedUploadPatch('6acdd8d8')).toEqual({
      upload_state: 'uploaded',
      upload_error: '',
      server_file_id: '6acdd8d8',
    });
  });

  it('keeps the reason on failure', () => {
    const failed = record(failUploadPatch('ارتباط برقرار نیست'));
    expect(uploadStateOf(failed)).toBe(ASSET_UPLOAD_STATE.failed);
    expect(uploadErrorOf(failed)).toBe('ارتباط برقرار نیست');
  });

  it('clears a stale reason when a new attempt starts', () => {
    const retried = record({ ...failUploadPatch('قبلاً ناموفق بود'), ...beginUploadPatch() });
    expect(uploadStateOf(retried)).toBe(ASSET_UPLOAD_STATE.uploading);
    expect(uploadErrorOf(retried)).toBe('');
  });

  it('reads no reason from a row that never recorded one', () => {
    expect(uploadErrorOf(record({}))).toBe('');
  });
});
