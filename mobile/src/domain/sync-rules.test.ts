import { describe, expect, it } from 'vitest';

import type { AccidentDraft, QueueRecord } from '@/domain/types';
import {
  computeNextRetryAt,
  decideOutcome,
  isDefinitiveResubmitRejection,
  MAX_SYNC_ATTEMPTS,
  needsResubmit,
  pickSubmissionAction,
  reconcileEditedSynced,
  recoverStaleSyncing,
  shouldProcessRecord,
} from './sync-rules';

function makeQueueRecord(overrides: Partial<QueueRecord> = {}): QueueRecord {
  return {
    attempts: 0,
    client_report_uuid: 'uuid-1',
    id: 'queue-uuid-1',
    status: 'queued',
    updated_at: new Date(0).toISOString(),
    ...overrides,
  };
}

function makeDraft(overrides: Partial<AccidentDraft> = {}): AccidentDraft {
  return {
    client_report_uuid: 'uuid-1',
    data: {},
    schema_version: 1,
    sync_status: 'queued',
    updated_at: new Date(0).toISOString(),
    ...overrides,
  };
}

describe('retry decisions', () => {
  it('retries validation-free transport failures with bounded backoff', () => {
    const outcome = decideOutcome('timeout', 0, 1_000);
    expect(outcome.type).toBe('retry');
    if (outcome.type === 'retry') {
      expect(new Date(outcome.nextRetryAt).getTime()).toBe(1_000 + 60_000);
    }
  });

  it('exhausts after the maximum attempt count', () => {
    expect(decideOutcome('timeout', MAX_SYNC_ATTEMPTS - 1, 0).type).toBe('exhausted');
    expect(decideOutcome('timeout', MAX_SYNC_ATTEMPTS, 0).type).toBe('exhausted');
  });

  it('marks permanent categories as rejected without retry', () => {
    for (const code of ['validation', 'unauthorized', 'forbidden'] as const) {
      expect(decideOutcome(code, 0, 0)).toEqual({ type: 'rejected', reason: '' });
    }
  });

  it('clamps backoff to the configured schedule', () => {
    const first = computeNextRetryAt(1, 0);
    const last = computeNextRetryAt(Number.MAX_SAFE_INTEGER, 0);
    expect(new Date(last).getTime() - new Date(first).getTime()).toBeGreaterThan(0);
    expect(new Date(computeNextRetryAt(99, 0)).getTime()).toBe(60 * 60_000);
  });
});

describe('queue scheduling', () => {
  it('processes queued records that are due', () => {
    expect(shouldProcessRecord(makeQueueRecord({ status: 'queued' }), 5_000)).toBe(true);
    expect(
      shouldProcessRecord(
        makeQueueRecord({ status: 'queued', next_retry_at: new Date(4_000).toISOString() }),
        5_000,
      ),
    ).toBe(true);
    expect(
      shouldProcessRecord(
        makeQueueRecord({ status: 'queued', next_retry_at: new Date(6_000).toISOString() }),
        5_000,
      ),
    ).toBe(false);
    expect(shouldProcessRecord(makeQueueRecord({ status: 'synced' }), 5_000)).toBe(false);
  });

  it('recovers stale syncing records back to queued', () => {
    const now = Date.now();
    const stale = makeQueueRecord({
      status: 'syncing',
      updated_at: new Date(now - 11 * 60_000).toISOString(),
    });
    const fresh = makeQueueRecord({
      id: 'q2',
      status: 'syncing',
      updated_at: new Date(now - 60_000).toISOString(),
    });
    const recovered = recoverStaleSyncing([stale, fresh], now);
    expect(recovered[0].status).toBe('queued');
    expect(recovered[1].status).toBe('syncing');
  });

  it('requeues synced records whose draft is locally dirty again', () => {
    const now = Date.now();
    const edited = makeQueueRecord({ client_report_uuid: 'u1', status: 'synced' });
    const untouched = makeQueueRecord({ id: 'q2', client_report_uuid: 'u2', status: 'synced' });
    const statuses = new Map([
      ['u1', 'draft' as const],
      ['u2', 'synced' as const],
    ]);
    const reconciled = reconcileEditedSynced([edited, untouched], statuses, now);
    expect(reconciled[0].status).toBe('queued');
    expect(reconciled[0].client_report_uuid).toBe('u1');
    expect(reconciled[1].status).toBe('synced');
  });

  it('leaves synced records alone when the draft was deleted', () => {
    const now = Date.now();
    const record = makeQueueRecord({ status: 'synced' });
    expect(reconcileEditedSynced([record], new Map(), now)[0].status).toBe('synced');
  });
});

describe('submission act selection (correction loop)', () => {
  it('uses accident.add for drafts without a server record', () => {
    expect(pickSubmissionAction(makeDraft())).toEqual({ act: 'add' });
  });

  it('switches to update-by-uuid once a server record exists', () => {
    const draft = makeDraft({ server_id: 'server-1' });
    expect(pickSubmissionAction(draft)).toEqual({
      act: 'update',
      clientReportUuid: 'uuid-1',
    });
  });

  it('flags returned reports with a server record for resubmission', () => {
    expect(needsResubmit(makeDraft({ server_id: 'server-1' }))).toBe(false);
    expect(needsResubmit(makeDraft({ server_id: 'server-1', data: { review_status: 'returned' } }))).toBe(true);
    expect(needsResubmit(makeDraft({ data: { review_status: 'returned' } }))).toBe(false);
  });

  it('treats definitive resubmit rejections as final and transport errors as retryable', () => {
    expect(isDefinitiveResubmitRejection('validation')).toBe(true);
    expect(isDefinitiveResubmitRejection('forbidden')).toBe(true);
    expect(isDefinitiveResubmitRejection('timeout')).toBe(false);
    expect(isDefinitiveResubmitRejection('offline')).toBe(false);
    expect(isDefinitiveResubmitRejection('unknown')).toBe(false);
  });
});
