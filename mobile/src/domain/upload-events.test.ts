import { describe, expect, it } from 'vitest';

import {
  applyUploadEvent,
  initialUploadProgress,
  skippedFilesField,
  skipSetOf,
  type UploadEvent,
  type UploadProgress,
} from './upload-events';

function reduce(events: UploadEvent[], from: UploadProgress = initialUploadProgress()) {
  return events.reduce<UploadProgress>(applyUploadEvent, from);
}

describe('upload progress', () => {
  it('starts in planning with no files known', () => {
    expect(initialUploadProgress()).toMatchObject({ phase: 'planning', done: 0, total: 0 });
  });

  it('counts total from the first file and tracks the current filename', () => {
    const state = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'پلاک.jpg', index: 0, total: 2 },
    ]);
    expect(state).toMatchObject({ phase: 'uploading', total: 2, current: 'پلاک.jpg', done: 0 });
  });

  it('advances done and keeps current while the next file runs', () => {
    const state = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'پلاک.jpg', index: 0, total: 2 },
      { type: 'file-done', mediaId: 'm1', ok: true },
      { type: 'file-start', mediaId: 'm2', name: 'بیمه.jpg', index: 1, total: 2 },
    ]);
    expect(state).toMatchObject({ done: 1, total: 2, current: 'بیمه.jpg' });
  });

  it('counts a failed file as finished without calling it a success', () => {
    const state = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'کروکی.jpg', index: 0, total: 1 },
      { type: 'file-failed', mediaId: 'm1', name: 'کروکی.jpg', reason: 'خطای شبکه' },
    ]);
    expect(state.done).toBe(1);
    expect(state.failed).toEqual([{ mediaId: 'm1', name: 'کروکی.jpg', reason: 'خطای شبکه' }]);
    expect(state.current).toBeNull();
  });

  it('keeps sweeping after a failure so one bad photo cannot strand the rest', () => {
    const state = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'a.jpg', index: 0, total: 3 },
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'الف' },
      { type: 'file-start', mediaId: 'm2', name: 'b.jpg', index: 1, total: 3 },
      { type: 'file-done', mediaId: 'm2', ok: true },
      { type: 'file-start', mediaId: 'm3', name: 'c.jpg', index: 2, total: 3 },
      { type: 'file-done', mediaId: 'm3', ok: true },
    ]);
    expect(state.phase).toBe('uploading');
    expect(state.done).toBe(3);
    expect(state.failed).toHaveLength(1);
  });

  it('keeps earlier failures when a later file also fails', () => {
    const state = reduce([
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'الف' },
      { type: 'file-failed', mediaId: 'm2', name: 'b.jpg', reason: 'ب' },
    ]);
    expect(state.failed.map(f => f.mediaId)).toEqual(['m1', 'm2']);
  });

  it('deduplicates a repeated failure for the same file', () => {
    const state = reduce([
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'الف' },
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'ب' },
    ]);
    expect(state.failed).toHaveLength(1);
  });

  it('holds at attention when the sweep ends with a failure, instead of submitting', () => {
    const state = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'a.jpg', index: 0, total: 2 },
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'خطا' },
      { type: 'file-start', mediaId: 'm2', name: 'b.jpg', index: 1, total: 2 },
      { type: 'file-done', mediaId: 'm2', ok: true },
      { type: 'phase', phase: 'linking' },
    ]);
    expect(state.phase).toBe('attention');
    expect(state.failed).toHaveLength(1);
  });

  it('holds on submitting too, so no report is filed past an unresolved failure', () => {
    const state = reduce([
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'خطا' },
      { type: 'phase', phase: 'submitting' },
    ]);
    expect(state.phase).toBe('attention');
  });

  it('does not hold when nothing failed', () => {
    const state = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'a.jpg', index: 0, total: 1 },
      { type: 'file-done', mediaId: 'm1', ok: true },
      { type: 'phase', phase: 'linking' },
      { type: 'phase', phase: 'submitting' },
    ]);
    expect(state.phase).toBe('submitting');
  });

  it('stays held once attention is reached — no event drags the modal forward', () => {
    const state = reduce([
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'خطا' },
      { type: 'phase', phase: 'linking' },
      { type: 'phase', phase: 'submitting' },
      { type: 'report-done', status: 'synced' },
    ]);
    expect(state.phase).toBe('attention');
  });

  it('releases the hold when the officer chooses to skip the failed file', () => {
    const state = reduce([
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'خطا' },
      { type: 'phase', phase: 'linking' },
      { type: 'failures-resolved', skip: ['m1'] },
      { type: 'phase', phase: 'submitting' },
    ]);
    expect(state.phase).toBe('submitting');
    expect(state.failed).toEqual([]);
  });

  it('names the skipped files so the console can see the evidence is missing', () => {
    const state = reduce([
      { type: 'file-failed', mediaId: 'm1', name: 'کروکی.jpg', reason: 'خطای شبکه' },
    ]);
    expect(skippedFilesField(state)).toEqual({
      skipped_files: [{ name: 'کروکی.jpg', reason: 'خطای شبکه' }],
    });
  });

  it('records nothing when no file was skipped', () => {
    expect(skippedFilesField(initialUploadProgress())).toEqual({});
  });

  it('hands the failed media ids back as the skip set for the next attempt', () => {
    const state = reduce([
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'الف' },
      { type: 'file-failed', mediaId: 'm2', name: 'b.jpg', reason: 'ب' },
    ]);
    expect([...skipSetOf(state)]).toEqual(['m1', 'm2']);
  });

  it('resets counters when a retry starts over', () => {
    const first = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'a.jpg', index: 0, total: 2 },
      { type: 'file-failed', mediaId: 'm1', name: 'a.jpg', reason: 'خطا' },
    ]);
    const second = applyUploadEvent(first, { type: 'phase', phase: 'uploading' });
    expect(second).toMatchObject({ done: 0, total: 0, failed: [], current: null });
  });

  it('carries the officer forward through linking and submitting', () => {
    const state = reduce([
      { type: 'phase', phase: 'linking' },
      { type: 'phase', phase: 'submitting' },
    ]);
    expect(state.phase).toBe('submitting');
  });

  it('reports percent from done over total, and 0 when the total is unknown', () => {
    const zero = initialUploadProgress();
    expect(zero.percent).toBe(0);

    const half = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'a.jpg', index: 0, total: 4 },
      { type: 'file-done', mediaId: 'm1', ok: true },
      { type: 'file-start', mediaId: 'm2', name: 'b.jpg', index: 1, total: 4 },
    ]);
    expect(half.percent).toBe(25);
  });

  it('clamps percent when more files finish than were announced', () => {
    const state = reduce([
      { type: 'file-start', mediaId: 'm1', name: 'a.jpg', index: 0, total: 1 },
      { type: 'file-done', mediaId: 'm1', ok: true },
      { type: 'file-done', mediaId: 'm1', ok: true },
    ]);
    expect(state.percent).toBe(100);
  });

  it('treats a report with nothing left to move as an instant submit', () => {
    const state = reduce([
      { type: 'phase', phase: 'uploading' },
      { type: 'phase', phase: 'submitting' },
      { type: 'report-done', status: 'synced' },
    ]);
    expect(state.phase).toBe('done');
  });

  it('shows the reason a report was refused', () => {
    const state = reduce([{ type: 'report-done', status: 'rejected', reason: 'اطلاعات ناقص است' }]);
    expect(state).toMatchObject({ phase: 'failed', reason: 'اطلاعات ناقص است' });
  });

  it('leaves the phase alone on a retry outcome so the queue can try again later', () => {
    const state = reduce([{ type: 'report-done', status: 'retry' }]);
    expect(state.phase).toBe('failed');
    expect(state.reason).toBeNull();
  });
});