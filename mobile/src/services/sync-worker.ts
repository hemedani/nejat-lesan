import { ApiError, translateApiError } from '@/api/errors';
import { fetchPatrolProcess } from '@/api/accident-process';
import {
  resubmitReturnedReport,
  submitAccidentReport,
  updateAccidentReportByUuid,
} from '@/api/accident';
import {
  resubmitReturnedIncidentReport,
  submitIncidentReport,
  updateIncidentReportByUuid,
} from '@/api/incident-report';
import { snapPointToRoad } from '@/api/road';
import { getAppConfig } from '@/config/env';
import {
  buildAccidentAddSet,
  buildIncidentReportAddSet,
  type AccidentAddSet,
  type SubmissionProvenance,
} from '@/domain/accident-mapper';
import { incidentTypeOf } from '@/domain/incident-type';
import { toRoadSnap } from '@/domain/road-snap';
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
import type { AccidentDraft, QueueRecord, RoadSnap, Session } from '@/domain/types';
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
  /**
   * Whether this call actually ran.
   *
   * False when another run already held the lock: the lock is what stops two runs
   * double-submitting the same queue, and a caller that reported the counts of a run
   * that never happened would be describing somebody else's run — or, worse, saying
   * "nothing to do" about a queue that is being worked right now.
   */
  started: boolean;
};

export type SyncWorker = {
  start(): () => void;
  run(manual?: boolean): Promise<SyncRunSummary>;
};

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * The build that filed this report, or `null` when it cannot be named.
 *
 * `0.0.0` is what `getAppConfig` returns when the running build has no version —
 * in an Expo Go dev session, for instance. That is not a version, so it is never
 * stamped: a report must not claim a build we cannot vouch for, and the absence
 * is also what keeps it out of the app-submitted population the oversight
 * statistics measure.
 */
function submissionProvenance(): SubmissionProvenance | null {
  const { appVersion, platform } = getAppConfig();
  if (!appVersion || appVersion === '0.0.0') {
    return null;
  }
  return { app_version: appVersion, platform };
}

/**
 * The road snap for a draft, resolving it now if the pin was confirmed offline.
 *
 * The location picker promises «اطلاعات راه پس از اتصال تکمیل میشود» and stores
 * no snap when the officer confirms without a connection, so this is the only
 * place that lookup ever happens. Best-effort by contract: the officer was told
 * they could continue without the road, so a failed lookup must never block the
 * report — it just leaves the road reference unset.
 */
async function resolveRoadSnap(draft: AccidentDraft): Promise<RoadSnap | null> {
  if (draft.road_snap) {
    return draft.road_snap;
  }
  const coords = draft.incident_coords ?? draft.gps_coords;
  if (!coords) {
    return null;
  }
  try {
    return toRoadSnap(await snapPointToRoad(coords));
  } catch {
    return null;
  }
}

/** The report columns a snap contributes. Absent values are never sent. */
function roadFields(snap: RoadSnap | null): Record<string, unknown> {
  if (!snap) {
    return {};
  }
  const fields: Record<string, unknown> = {};
  if (snap.road_id) fields['roadId'] = snap.road_id;
  if (typeof snap.kilometer === 'number') fields['kilometer'] = snap.kilometer;
  if (typeof snap.meter === 'number') fields['meter'] = snap.meter;
  if (snap.direction) fields['travel_direction'] = snap.direction;
  return fields;
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
  isReport: boolean,
): Promise<'synced' | 'rejected' | 'retry'> {
  try {
    // The two models have their own resubmit act, and a report announced through
    // the accident one would simply not be found.
    if (isReport) {
      await resubmitReturnedIncidentReport(session, draft.server_id as string);
    } else {
      await resubmitReturnedReport(session, draft.server_id as string);
    }
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

/**
 * Org-process drafts snapshot `process_version` at capture time. When the org
 * re-activates a newer wizard version, the captured answers may not match the
 * new questions — pause the queued submission and ask the officer to reopen
 * the draft (the wizard refetches the active process). Offline and module/org
 * errors keep the current behavior (best-effort submit).
 */
async function checkProcessVersionFreshness(
  session: Session,
  draft: AccidentDraft,
): Promise<'ok' | 'stale'> {
  const raw = draft.data?.['process_version'];
  const captured = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (!Number.isFinite(captured)) {
    return 'ok';
  }
  try {
    const connectivity = await getConnectivitySnapshot();
    if (connectivity.status === 'offline') {
      return 'ok';
    }
    const type = incidentTypeOf(draft);
    const result = await fetchPatrolProcess(session, type);
    const active = result.process?.version;
    if (result.process && active != null && Number(active) !== captured) {
      return 'stale';
    }
  } catch {
    // Module off, org membership missing, transport — do not block the report.
  }
  return 'ok';
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

  // Which model this draft belongs to decides the mapper, the submission act and
  // the resubmit act. `accident` is the backward-compatible default, so only an
  // explicit road_breakdown/road_obstacle/other routes to `incident_report`.
  const isReport = incidentTypeOf(draft) !== 'accident';

  // A report has no vehicle cards by construction, so the gate is accident-only.
  if (!isReport && hasIncompleteRequiredVehicleCards(readFormState(draft))) {
    await persistQueueAndDraft(draft, record, {
      status: 'queued',
      attempts: record.attempts,
      nextRetryAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      lastError: 'کارت وسیله نقلیه کامل نیست؛ ارسال تا تکمیل آن متوقف می‌ماند.',
    });
    return 'retry';
  }

  const processFreshness = await checkProcessVersionFreshness(session, draft);
  if (processFreshness === 'stale') {
    await persistQueueAndDraft(draft, record, {
      status: 'queued',
      attempts: record.attempts,
      nextRetryAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      lastError:
        'فرآیند ثبت سازمان به‌روزرسانی شده است؛ گزارش را باز کنید تا با فرآیند جدید تکمیل و دوباره ارسال شود.',
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

  const provenance = submissionProvenance();
  const mapped = isReport
    ? buildIncidentReportAddSet(workingDraft, provenance)
    : buildAccidentAddSet(workingDraft);
  if (!mapped.ok) {
    await persistQueueAndDraft(draft, record, {
      status: 'rejected',
      attempts: record.attempts,
      nextRetryAt: null,
      lastError: mapped.reason,
    });
    return 'rejected';
  }

  // The deferred half of the road snap. Run only after the mapper accepts, so a
  // draft with no coordinates at all is rejected without a pointless lookup.
  const roadSnap = await resolveRoadSnap(workingDraft);
  const submissionDraft: AccidentDraft =
    roadSnap && !workingDraft.road_snap
      ? { ...workingDraft, road_snap: roadSnap }
      : workingDraft;

  const set: Record<string, unknown> = { ...mapped.set, ...roadFields(roadSnap) };
  // The report mapper already stamps provenance; the accident mapper does not, so
  // this fills it in once for both rather than teaching each mapper the same rule.
  if (provenance && set['submitted_from'] === undefined) {
    set['submitted_from'] = {
      app_version: provenance.app_version,
      platform: provenance.platform,
    };
  }

  try {
    const submission = pickSubmissionAction(submissionDraft);
    const ack = isReport
      ? submission.act === 'update'
        ? await updateIncidentReportByUuid(
            session,
            submissionDraft.client_report_uuid,
            set,
          )
        : await submitIncidentReport(session, set)
      : submission.act === 'update'
        ? await updateAccidentReportByUuid(
            session,
            submissionDraft.client_report_uuid,
            set as unknown as AccidentAddSet,
          )
        : await submitAccidentReport(session, set as unknown as AccidentAddSet);

    const syncedDraft: AccidentDraft = {
      ...submissionDraft,
      sync_status: 'synced',
      server_id: ack._id,
      report_id: ack.report_id ?? submissionDraft.report_id,
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
      return await handleResubmitAfterSync(session, syncedDraft, record, isReport);
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
    const summary: SyncRunSummary = {
      processed: 0,
      synced: 0,
      rejected: 0,
      retried: 0,
      started: false,
    };
    if (running) {
      return summary;
    }
    running = true;
    summary.started = true;
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
