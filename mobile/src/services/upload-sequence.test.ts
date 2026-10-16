import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/errors';

import { runUploadSequence, type UploadSequenceItem } from './upload-sequence';

type Item = UploadSequenceItem & { extra?: string };

function item(id: string, overrides: Partial<Item> = {}): Item {
  return { id, name: `${id}.jpg`, ...overrides };
}

describe('upload sequence', () => {
  it('uploads one file at a time and reports each start before its result', async () => {
    const events: string[] = [];
    const result = await runUploadSequence(
      [item('m1'), item('m2')],
      async record => {
        events.push(`upload:${record.id}`);
        return `file-${record.id}`;
      },
      {
        onFileStart: record => events.push(`start:${record.id}`),
        onFileDone: record => events.push(`done:${record.id}`),
      },
    );

    expect(events).toEqual(['start:m1', 'upload:m1', 'done:m1', 'start:m2', 'upload:m2', 'done:m2']);
    expect(result.uploaded).toBe(2);
    expect(result.fileIds.get('m1')).toBe('file-m1');
    expect(result.failed).toEqual([]);
  });

  it('announces the total so the bar has something to divide by', async () => {
    const totals: number[] = [];
    await runUploadSequence(
      [item('m1'), item('m2'), item('m3')],
      async record => `file-${record.id}`,
      { onFileStart: (_record, _index, total) => totals.push(total) },
    );
    expect(totals).toEqual([3, 3, 3]);
  });

  it('keeps going after a failure and collects it', async () => {
    const result = await runUploadSequence(
      [item('m1'), item('m2'), item('m3')],
      async record => {
        if (record.id === 'm2') {
          throw new ApiError('ارسال فایل ناموفق بود', 'timeout');
        }
        return `file-${record.id}`;
      },
    );

    expect(result.uploaded).toBe(2);
    expect(result.failed).toEqual([
      { mediaId: 'm2', name: 'm2.jpg', reason: 'پاسخ سرور بیش از حد طول کشید. دوباره تلاش کنید.' },
    ]);
    expect(result.fileIds.get('m3')).toBe('file-m3');
  });

  it('translates the failure instead of handing a raw backend string to the UI', async () => {
    const result = await runUploadSequence([item('m1')], async () => {
      // The shape a failed act actually arrives in: a backend body, already Persian.
      throw new ApiError('timeout', 'timeout', 504, { message: 'ETIMEDOUT 10.0.0.4:1404' });
    });
    expect(result.failed[0].reason).not.toContain('10.0.0.4');
    expect(result.failed[0].reason).toBe('پاسخ سرور بیش از حد طول کشید. دوباره تلاش کنید.');
  });

  it('never throws, whatever a single file does', async () => {
    await expect(
      runUploadSequence([item('m1')], async () => {
        throw new Error('boom');
      }),
    ).resolves.toMatchObject({ uploaded: 0, failed: [{ mediaId: 'm1' }] });
  });

  it('persists each server id as soon as it arrives', async () => {
    const persisted: string[] = [];
    await runUploadSequence(
      [item('m1'), item('m2')],
      async record => `file-${record.id}`,
      { persistFileId: async (record, fileId) => void persisted.push(`${record.id}=${fileId}`) },
    );
    expect(persisted).toEqual(['m1=file-m1', 'm2=file-m2']);
  });

  it('does not persist an id for a file that failed', async () => {
    const persistFileId = vi.fn(async () => {});
    await runUploadSequence(
      [item('m1')],
      async () => {
        throw new ApiError('خطا', 'server');
      },
      { persistFileId },
    );
    expect(persistFileId).not.toHaveBeenCalled();
  });

  it('skips an already-uploaded record instead of sending it again', async () => {
    const upload = vi.fn(async () => 'file-new');
    const result = await runUploadSequence(
      [item('m1', { serverFileId: 'file-old' }), item('m2')],
      upload,
    );

    expect(upload).toHaveBeenCalledTimes(1);
    expect(result.fileIds.get('m1')).toBe('file-old');
    expect(result.uploaded).toBe(1);
  });

  it('does not announce an already-uploaded record — it would stall the bar', async () => {
    const onFileStart = vi.fn();
    await runUploadSequence([item('m1', { serverFileId: 'file-old' })], async () => 'x', {
      onFileStart,
    });
    expect(onFileStart).not.toHaveBeenCalled();
  });

  it('leaves a skipped record alone on a retry and reports the total without it', async () => {
    const totals: number[] = [];
    const upload = vi.fn(async (record: Item) => `file-${record.id}`);
    const result = await runUploadSequence(
      [item('m1'), item('m2')],
      upload,
      { onFileStart: (_record, _index, total) => totals.push(total) },
      new Set(['m2']),
    );

    expect(upload).toHaveBeenCalledTimes(1);
    expect(totals).toEqual([1]);
    expect(result.failed).toEqual([]);
    expect(result.fileIds.has('m2')).toBe(false);
  });

  it('does nothing at all for an empty pipeline', async () => {
    const result = await runUploadSequence([], async () => 'x');
    expect(result).toMatchObject({ uploaded: 0, failed: [] });
    expect(result.fileIds.size).toBe(0);
  });
});