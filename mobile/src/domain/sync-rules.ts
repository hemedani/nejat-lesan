import type { ApiErrorCode } from '@/api/errors';
import type { AccidentDraft, QueueRecord, SyncStatus } from '@/domain/types';

export const MAX_SYNC_ATTEMPTS = 5;
export const RETRY_BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000] as const;
export const STALE_SYNCING_MS = 10 * 60_000;

export type SyncOutcome =
  | { type: 'ack' }
  | { type: 'retry'; nextRetryAt: string }
  | { type: 'exhausted' }
  | { type: 'rejected'; reason: string };

export function computeNextRetryAt(attempts: number, nowMs: number): string {
  const index = Math.min(Math.max(attempts - 1, 0), RETRY_BACKOFF_MS.length - 1);
  return new Date(nowMs + RETRY_BACKOFF_MS[index]).toISOString();
}

export function shouldProcessRecord(record: QueueRecord, nowMs: number): boolean {
  if (record.status !== 'queued') {
    return false;
  }
  if (!record.next_retry_at) {
    return true;
  }
  return new Date(record.next_retry_at).getTime() <= nowMs;
}

export function recoverStaleSyncing(records: QueueRecord[], nowMs: number): QueueRecord[] {
  return records.map(record => {
    if (record.status !== 'syncing') {
      return record;
    }
    const age = nowMs - new Date(record.updated_at).getTime();
    if (age < STALE_SYNCING_MS) {
      return record;
    }
    return { ...record, status: 'queued' as SyncStatus, updated_at: new Date(nowMs).toISOString() };
  });
}

/**
 * A «synced» queue record whose draft is locally dirty again (correction flow,
 * force-close mid-edit) must return to the queue or the edits never resubmit.
 */
export function reconcileEditedSynced(
  records: QueueRecord[],
  draftStatuses: ReadonlyMap<string, SyncStatus>,
  nowMs: number,
): QueueRecord[] {
  return records.map(record => {
    if (record.status !== 'synced') {
      return record;
    }
    const draftStatus = draftStatuses.get(record.client_report_uuid);
    if (!draftStatus || draftStatus === 'synced') {
      return record;
    }
    return { ...record, status: 'queued' as SyncStatus, updated_at: new Date(nowMs).toISOString() };
  });
}

export type SubmissionAction =
  | { act: 'add' }
  | { act: 'update'; clientReportUuid: string };

/**
 * A report that already exists on the server must be edited through
 * `accident.update` (by uuid); calling `add` again would idempotently
 * return the old record and silently drop the officer's corrections.
 */
export function pickSubmissionAction(draft: AccidentDraft): SubmissionAction {
  if (draft.server_id && draft.server_id.length > 0) {
    return { act: 'update', clientReportUuid: draft.client_report_uuid };
  }
  return { act: 'add' };
}

/** The draft carries a server «returned» flag that still needs resubmitReport. */
export function needsResubmit(draft: AccidentDraft): boolean {
  const reviewStatus = draft.data?.['review_status'];
  return (
    typeof draft.server_id === 'string' &&
    draft.server_id.length > 0 &&
    reviewStatus === 'returned'
  );
}

const REJECTED_CODES: ReadonlySet<ApiErrorCode> = new Set<ApiErrorCode>([
  'validation',
  'unauthorized',
  'forbidden',
]);

/**
 * resubmitReport fails definitively when the report is no longer «returned»
 * (already resubmitted/approved elsewhere) or does not belong to the officer.
 * Those cases must clear the local flag instead of retrying forever;
 * transport failures stay retryable.
 */
export function isDefinitiveResubmitRejection(errorCode: ApiErrorCode): boolean {
  return errorCode === 'validation' || errorCode === 'unauthorized' || errorCode === 'forbidden';
}

export function decideOutcome(errorCode: ApiErrorCode, attempts: number, nowMs: number): SyncOutcome {
  if (REJECTED_CODES.has(errorCode)) {
    return { type: 'rejected', reason: '' };
  }
  const nextAttempts = attempts + 1;
  if (nextAttempts >= MAX_SYNC_ATTEMPTS) {
    return { type: 'exhausted' };
  }
  return { type: 'retry', nextRetryAt: computeNextRetryAt(nextAttempts, nowMs) };
}

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  draft: 'پیش‌نویس',
  queued: 'در صف ارسال',
  syncing: 'در حال ارسال',
  synced: 'ارسال‌شده',
  rejected: 'ردشده',
};
