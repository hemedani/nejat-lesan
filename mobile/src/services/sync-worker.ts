import { ApiError, translateApiError } from '@/api/errors';
import {
  resubmitReturnedReport,
  submitAccidentReport,
  updateAccidentReportByUuid,
} from '@/api/accident';
import { getAppConfig } from '@/config/env';
import { buildAccidentAddSet } from '@/domain/accident-mapper';
import {
  hasIncompleteRequiredVehicleCards,
  readFormState,
} from '@/domain/accident-form';
import {
  decideOutcome,
  isDefinitiveResubmitRejection,
  needsResubmit,
  pickSubmissionAction,
  reconcileEditedSynced,
  recoverStaleSyncing,
  shouldProcessRecord,
} from '@/domain/sync-rules';
import type { AccidentDraft, QueueRecord, Session } from '@/domain/types';
import { createSessionService } from '@/auth/session-service';
import { syncReportMedia } from '@/services/media-upload-service';
import {
  clearDraftReturnedFlag,
} from '@/domain/draft-actions';
import {
  getDraft,
  listDrafts,
  listQueueRecords,
  saveDraft,
  saveQueueRecord,
} from '@/storage/local-database';
import {
  getConnectivitySnapshot,
  subscribeToConnectivity,
} from '@/services/connectivity';

export type SyncRunSummary = {
  processed: number;
  synced: number;
  rejected: number;
  retried: number;
};

export type SyncWorker = {
  start(): () => void;
  run(manual?: boolean): Promise<SyncRunSummary>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function isProcessable(record: QueueRecord, manual: boolean, nowMs: number): boolean {
  if (record.status === 'synced' || record.status === 'syncing') {
    return false;
  }
  if (manual) {
    return true;
  }
  return shouldProcessRecord(record, nowMs);
}

async function persistQueueAndDraft(
  draft: AccidentDraft | null,
  record: QueueRecord,
  patch: {
    status: QueueRecord['status'];
    attempts: number;
    nextRetryAt?: string | null;
    lastError?: string | null;
  },
): Promise<void> {
  const timestamp = nowIso();
  const updated: QueueRecord = {
    ...record,
    status: patch.status,
    attempts: patch.attempts,
    next_retry_at: patch.nextRetryAt ?? undefined,
    last_error: patch.lastError ?? undefined,
    updated_at: timestamp,
  };
  await saveQueueRecord(updated);
  if (draft) {
    await saveDraft({
      ...draft,
      sync_status: patch.status,
      rejection_reason:
        patch.status === 'rejected' ? patch.lastError ?? draft.rejection_reason : undefined,
      updated_at: timestamp,
    });
  }
}

async function handleResubmitAfterSync(
  session: Session,
  draft: AccidentDraft,
  record: QueueRecord,
): Promise<'synced' | 'rejected' | 'retry'> {
  try {
    await resubmitReturnedReport(session, draft.server_id as string);
    await clearDraftReturnedFlag(draft.client_report_uuid);
    return 'synced';
  } catch (error) {
    const code = error instanceof ApiError ? error.code : 'unknown';
    if (isDefinitiveResubmitRejection(code)) {
      // The report is no longer «returned» on the server (already resubmitted,
      // approved, or not owned) — drop the stale local flag and finish.
      await clearDraftReturnedFlag(draft.client_report_uuid);
      return 'synced';
    }
    const outcome = decideOutcome(code, record.attempts, Date.now());
    const reason = translateApiError(error);
    if (outcome.type === 'retry') {
      await persistQueueAndDraft(draft, record, {
        status: 'queued',
        attempts: record.attempts + 1,
        nextRetryAt: outcome.nextRetryAt,
        lastError: `${reason} (اعلام اصلاحیه به مرکز باقی مانده است.)`,
      });
      return 'retry';
    }
    await persistQueueAndDraft(draft, record, {
      status: 'rejected',
      attempts: record.attempts + 1,
      nextRetryAt: null,
      lastError: 'اصلاحیه ذخیره شد اما اعلام آن به مرکز ناموفق بود؛ دوباره تلاش کنید.',
    });
    return 'rejected';
  }
}

async function processRecord(
  session: Session,
  record: QueueRecord,
): Promise<'synced' | 'rejected' | 'retry'> {
  const draft = await getDraft(record.client_report_uuid);
  if (!draft || draft.sync_status === 'synced') {
    await persistQueueAndDraft(draft, record, { status: 'synced', attempts: record.attempts });
    return 'synced';
  }

  await persistQueueAndDraft(draft, record, {
    status: 'syncing',
    attempts: record.attempts,
  });

  if (hasIncompleteRequiredVehicleCards(readFormState(draft))) {
    await persistQueueAndDraft(draft, record, {
      status: 'queued',
      attempts: record.attempts,
      nextRetryAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      lastError: 'کارت وسیله نقلیه کامل نیست؛ ارسال تا تکمیل آن متوقف می‌ماند.',
    });
    return 'retry';
  }

  // Categorized media upload (dormant unless EXPO_PUBLIC_ACCIDENT_UPLOADS=on):
  // files go up first so their server `_id`s can ride inside the report payload.
  let workingDraft = draft;
  if (getAppConfig().uploadsEnabled) {
    try {
      const mediaSync = await syncReportMedia(session, workingDraft);
      workingDraft = { ...workingDraft, data: mediaSync.data };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 'unknown';
      const outcome = decideOutcome(code, record.attempts, Date.now());
      const reason = translateApiError(error);
      if (outcome.type === 'retry') {
        await persistQueueAndDraft(draft, record, {
          status: 'queued',
          attempts: record.attempts + 1,
          nextRetryAt: outcome.nextRetryAt,
          lastError: `${reason} (ارسال تصاویر ناموفق بود.)`,
        });
        return 'retry';
      }
      await persistQueueAndDraft(draft, record, {
        status: 'rejected',
        attempts: record.attempts + 1,
        nextRetryAt: null,
        lastError: 'ارسال تصاویر پس از چند تلاش ناموفق بود؛ دوباره تلاش کنید.',
      });
      return 'rejected';
    }
  }

  const mapped = buildAccidentAddSet(workingDraft);
  if (!mapped.ok) {
    await persistQueueAndDraft(draft, record, {
      status: 'rejected',
      attempts: record.attempts,
      nextRetryAt: null,
      lastError: mapped.reason,
    });
    return 'rejected';
  }

  try {
    const submission = pickSubmissionAction(workingDraft);
    const ack =
      submission.act === 'update'
        ? await updateAccidentReportByUuid(session, workingDraft.client_report_uuid, mapped.set)
        : await submitAccidentReport(session, mapped.set);

    const syncedDraft: AccidentDraft = {
      ...workingDraft,
      sync_status: 'synced',
      server_id: ack._id,
      report_id: ack.report_id ?? workingDraft.report_id,
      rejection_reason: undefined,
      updated_at: nowIso(),
    };
    await persistQueueAndDraft(syncedDraft, record, {
      status: 'synced',
      attempts: record.attempts + 1,
      nextRetryAt: null,
      lastError: null,
    });

    if (needsResubmit(syncedDraft)) {
      return await handleResubmitAfterSync(session, syncedDraft, record);
    }
    return 'synced';
  } catch (error) {
    const code = error instanceof ApiError ? error.code : 'unknown';
    const outcome = decideOutcome(code, record.attempts, Date.now());
    const reason =
      outcome.type === 'exhausted'
        ? 'ارسال پس از چند تلاش ناموفق بود؛ دوباره تلاش کنید.'
        : translateApiError(error);

    if (outcome.type === 'retry') {
      await persistQueueAndDraft(draft, record, {
        status: 'queued',
        attempts: record.attempts + 1,
        nextRetryAt: outcome.nextRetryAt,
        lastError: reason,
      });
      return 'retry';
    }
    await persistQueueAndDraft(draft, record, {
      status: 'rejected',
      attempts: record.attempts + 1,
      nextRetryAt: null,
      lastError: reason,
    });
    return 'rejected';
  }
}

export function createSyncWorker(sessionService = createSessionService()): SyncWorker {
  let running = false;
  let unsubscribe: (() => void) | undefined;

  async function run(manual = false): Promise<SyncRunSummary> {
    const summary: SyncRunSummary = { processed: 0, synced: 0, rejected: 0, retried: 0 };
    if (running) {
      return summary;
    }
    running = true;
    try {
      const session = await sessionService.restore();
      if (!session) {
        return summary;
      }
      const connectivity = await getConnectivitySnapshot();
      if (connectivity.status === 'offline') {
        return summary;
      }

      const nowMs = Date.now();
      const original = await listQueueRecords();
      const recovered = recoverStaleSyncing(original, nowMs);

      // A «synced» record whose draft was edited again (correction flow) must
      // go back to the queue, otherwise the edits would never reach the server.
      const drafts = await listDrafts();
      const draftStatusByUuid = new Map(
        drafts.map(draft => [draft.client_report_uuid, draft.sync_status] as const),
      );
      const reconciled = reconcileEditedSynced(recovered, draftStatusByUuid, nowMs);
      for (let index = 0; index < original.length; index += 1) {
        if (original[index].status !== reconciled[index].status) {
          await saveQueueRecord(reconciled[index]);
        }
      }

      const due = reconciled.filter(record => isProcessable(record, manual, nowMs));
      for (const record of due) {
        const result = await processRecord(session, record);
        summary.processed += 1;
        if (result === 'synced') {
          summary.synced += 1;
        } else if (result === 'rejected') {
          summary.rejected += 1;
        } else {
          summary.retried += 1;
        }
      }
      return summary;
    } finally {
      running = false;
    }
  }

  return {
    start() {
      void run();
      unsubscribe ??= subscribeToConnectivity(snapshot => {
        if (snapshot.status !== 'offline') {
          void run();
        }
      });
      return () => {
        unsubscribe?.();
        unsubscribe = undefined;
      };
    },
    run,
  };
}

const defaultSyncWorker = createSyncWorker();

export function getSyncWorker(): SyncWorker {
  return defaultSyncWorker;
}
