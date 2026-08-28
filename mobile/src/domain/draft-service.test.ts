import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAccidentDraft } from './draft-service';
import {
  clearDraftReturnedFlag,
  markDraftReturned,
  requeueDraft,
  saveDraftFormData,
} from './draft-actions';

const drafts = new Map<string, Record<string, unknown>>();
const queueRecords = new Map<string, Record<string, unknown>>();

vi.mock('@/storage/local-database', () => ({
  getDraft: vi.fn(async (uuid: string) => drafts.get(uuid) ?? null),
  listDrafts: vi.fn(async () => [...drafts.values()]),
  listQueueRecords: vi.fn(async () => [...queueRecords.values()]),
  saveDraft: vi.fn(async (draft: Record<string, unknown>) => {
    drafts.set(String(draft.client_report_uuid), { ...draft });
  }),
  saveQueueRecord: vi.fn(async (record: Record<string, unknown>) => {
    queueRecords.set(String(record.id), { ...record });
  }),
}));

beforeEach(() => {
  drafts.clear();
  queueRecords.clear();
});

describe('client_report_uuid preservation', () => {
  it('creates one persistent uuid per draft and unique uuids across drafts', async () => {
    const first = await createAccidentDraft();
    expect(first.client_report_uuid).toMatch(/^[0-9a-f-]{36}$/);
    const second = await createAccidentDraft();
    expect(second.client_report_uuid).not.toBe(first.client_report_uuid);
  });

  it('keeps the same uuid when form data is saved repeatedly', async () => {
    const created = await createAccidentDraft();
    await saveDraftFormData(created.client_report_uuid, { severity: 'damage' });
    await saveDraftFormData(created.client_report_uuid, { severity: 'fatal' });
    const stored = drafts.get(created.client_report_uuid);
    expect(stored?.['client_report_uuid']).toBe(created.client_report_uuid);
    expect((stored?.data as Record<string, unknown>)['severity']).toBe('fatal');
    expect(stored?.['sync_status']).toBe('draft');
  });

  it('marks an edited synced report dirty so it re-enters the sync queue', async () => {
    const created = await createAccidentDraft();
    drafts.set(created.client_report_uuid, {
      ...drafts.get(created.client_report_uuid),
      server_id: 'server-1',
      sync_status: 'synced',
    });
    const updated = await saveDraftFormData(created.client_report_uuid, { severity: 'injury' });
    expect(updated?.sync_status).toBe('draft');
    expect(updated?.server_id).toBe('server-1');
  });

  it('requeue keeps the uuid and resets the retry budget', async () => {
    const created = await createAccidentDraft();
    const queueId = `queue-${created.client_report_uuid}`;
    queueRecords.set(queueId, {
      attempts: 4,
      client_report_uuid: created.client_report_uuid,
      id: queueId,
      last_error: 'boom',
      next_retry_at: new Date(0).toISOString(),
      status: 'rejected',
      updated_at: new Date(0).toISOString(),
    });

    await requeueDraft(created.client_report_uuid);
    const record = queueRecords.get(queueId) as Record<string, unknown> | undefined;
    expect(record?.attempts).toBe(0);
    expect(record?.status).toBe('queued');
    expect(record?.last_error).toBeUndefined();
    expect(drafts.get(created.client_report_uuid)?.['client_report_uuid']).toBe(
      created.client_report_uuid,
    );
  });
});

describe('returned-report correction flow', () => {
  it('marks a synced draft as returned with the expert note', async () => {
    const created = await createAccidentDraft();
    await markDraftReturned(created.client_report_uuid, 'توضیحات ناقص است');
    const data = drafts.get(created.client_report_uuid)?.data as Record<string, unknown>;
    expect(data['review_status']).toBe('returned');
    expect(data['review_reason']).toBe('توضیحات ناقص است');
  });

  it('clears the returned flag after successful resubmission without touching other fields', async () => {
    const created = await createAccidentDraft();
    await saveDraftFormData(created.client_report_uuid, { severity: 'injury' });
    await markDraftReturned(created.client_report_uuid, 'نقص مدارک');
    await clearDraftReturnedFlag(created.client_report_uuid);

    const stored = drafts.get(created.client_report_uuid) as Record<string, unknown>;
    expect(stored.data).not.toHaveProperty('review_status');
    expect(stored.data).not.toHaveProperty('review_reason');
    expect((stored.data as Record<string, unknown>)['severity']).toBe('injury');
  });

  it('ignores unknown drafts instead of throwing', async () => {
    await expect(markDraftReturned('missing')).resolves.toBeUndefined();
    await expect(clearDraftReturnedFlag('missing')).resolves.toBeUndefined();
    await expect(requeueDraft('missing')).resolves.toBeUndefined();
  });
});
