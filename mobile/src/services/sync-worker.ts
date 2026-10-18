import { ApiError, translateApiError } from '@/api/errors';
import { fetchPatrolProcess } from '@/api/accident-process';
import { fetchPatrolFormById } from '@/api/form-definition';
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
import { withAttachmentIds } from '@/domain/attachment-ids';
import type { RunBlocked, UploadEvent } from '@/domain/upload-events';
import {
  hasIncompleteRequiredVehicleCards,
  readFormState,
} from '@/domain/accident-form';
import {
  decideDefinitionFreshness,
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
import { syncFormAssets } from '@/services/asset-upload-service';
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
  /**
   * Why a run produced nothing, when nothing was its fault to produce.
   *
   * `null` for a run that worked, or one that lost the lock — the counts cannot say
   * "the device was offline" or "the queue was empty", and they look identical from
   * the outside. A caller watching a modal has no other way to learn that its run never
   * began, which is how an offline submit used to sit at 0% with no way out.
   */
  blocked: RunBlocked;
};

/**
 * What the officer is told when the run cannot start, in their own words.
 *
 * The copy has to promise only what is true: the report *is* saved and queued, and the
 * background worker will pick it up on the next connection. Saying «saved» is honest;
 * saying «sent» would not be.
 */
const BLOCKED_REASONS: Record<Exclude<RunBlocked, null>, string> = {
  no_session: 'نشست شما معتبر نیست؛ دوباره وارد شوید و گزارش از پیش‌نویس‌ها ارسال می‌شود.',
  offline: 'گزارش و فایل‌های آن روی دستگاه ذخیره شد و پس از اتصال به اینترنت ارسال می‌شود.',
};

/**
 * How a caller asks for a run.
 *
 * The background worker passes nothing and sees nothing. A caller that has put an
 * officer in front of a progress modal passes an observer and gets told what is
 * happening — which is the only reason the modal exists, and the reason this stays an
 * observer rather than a second submit path. There is one sequence; it is simply
 * sometimes narrated.
 */
export type SyncRunOptions = {
  /** Ignore `next_retry_at` and work every queued record now. */
  manual?: boolean;
  /** Work only this draft. A queue walk asks for one report at a time. */
  onlyDraft?: string;
  /** Receives the file-by-file story of the run, for the upload modal. */
  observe?: (event: UploadEvent) => void;
  /** Media ids to leave behind — the officer's «ادامه بدون این فایل». */
  skipUploads?: ReadonlySet<string>;
};

export type SyncWorker = {
  start(): () => void;
  run(options?: SyncRunOptions | boolean): Promise<SyncRunSummary>;
};

/**
 * Close out a run that could not begin, telling the observer why.
 *
 * The draft is untouched: `requeueDraft` already saved and queued it before the worker
 * was ever called, so this is a report on *this run*, not a verdict on the report.
 */
function block(
  summary: SyncRunSummary,
  reason: Exclude<RunBlocked, null>,
  observe?: (event: UploadEvent) => void,
): SyncRunSummary {
  summary.blocked = reason;
  observe?.({ type: 'deferred', reason: BLOCKED_REASONS[reason] });
  return summary;
}

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
async function resolveRoadSnap(draft: AccidentDraft, session: Session): Promise<RoadSnap | null> {
  if (draft.road_snap) {
    return draft.road_snap;
  }
  const coords = draft.incident_coords ?? draft.gps_coords;
  if (!coords) {
    return null;
  }
  try {
    // `road.snapPointToRoad` declares `setTokens` as a pre-act, so the `token`
    // header is required — without it the backend throws «you should send your
    // id with token key in req header» and this catch silently dropped the road.
    return toRoadSnap(await snapPointToRoad(coords, { token: session.token }));
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

/**
 * Dynamic-form drafts snapshot `form_version` at capture time, exactly as
 * org-process drafts snapshot `process_version`. The device now holds one copy of each
 * authored form — the newest — so a draft can be answered against a definition the
 * organization has since replaced. Hold it for the officer to reopen rather than file
 * answers shaped by questions that no longer exist.
 *
 * Offline and module/org errors keep the current behaviour (best-effort submit): the
 * officer has no way to act on a hold they cannot see resolved.
 */
async function checkFormVersionFreshness(
  session: Session,
  draft: AccidentDraft,
): Promise<'ok' | 'stale'> {
  const definitionId = draft.data?.['form_definition_id'];
  if (typeof definitionId !== 'string' || definitionId.length === 0) {
    return 'ok';
  }
  try {
    const connectivity = await getConnectivitySnapshot();
    if (connectivity.status === 'offline') {
      return 'ok';
    }
    const result = await fetchPatrolFormById(session, definitionId);
    return decideDefinitionFreshness(draft.data?.['form_version'], result?.version?.version);
  } catch {
    // Module off, org membership missing, transport — do not block the report.
  }
  return 'ok';
}

async function processRecord(
  session: Session,
  record: QueueRecord,
  options: SyncRunOptions,
): Promise<'synced' | 'rejected' | 'retry'> {
  const emit = options.observe;
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

  const formFreshness = await checkFormVersionFreshness(session, draft);
  if (formFreshness === 'stale') {
    await persistQueueAndDraft(draft, record, {
      status: 'queued',
      attempts: record.attempts,
      nextRetryAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      lastError:
        'فرم ثبت سازمان به‌روزرسانی شده است؛ گزارش را باز کنید تا با فرم جدید تکمیل و دوباره ارسال شود.',
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

  // Uploads (dormant unless EXPO_PUBLIC_ACCIDENT_UPLOADS=on): files go up first
  // so their server `_id`s can ride inside the report payload. The accident
  // wizard's fixed media slots go through the base64 image act; a dynamic form's
  // `file` fields go through the general multipart act, because they can carry
  // videos and documents as well as photos.
  //
  // Neither pass throws on a bad file any more: each collects its failures and
  // reports them, and the officer decides below. What used to be a thrown error
  // here threw away a whole report because one photo would not upload.
  let workingDraft = draft;
  if (getAppConfig().uploadsEnabled) {
    emit?.({ type: 'phase', phase: 'uploading' });
    const uploadOptions = { onProgress: emit, skip: options.skipUploads };
    try {
      const mediaSync = await syncReportMedia(session, workingDraft, uploadOptions);
      workingDraft = { ...workingDraft, data: mediaSync.data };
      const assetSync = await syncFormAssets(session, workingDraft, uploadOptions);
      // `assetSync.data` is the write-back: every local asset id swapped for the
      // server's, each `file` row split into `answer_ids` / `answer_names`, and the
      // assets the answers reference already merged into `attachmentsIds`. Taking
      // only `fileIds` from it kept the gallery working while the answers the officer
      // reads on the review screen still showed `asset-1792226098313-i9oxxj`.
      //
      // Both passes' ids are named explicitly rather than trusting the service to have
      // merged its own: `withAttachmentIds` de-duplicates, so listing them costs nothing
      // and keeps the gallery the union of the two passes no matter which one of them
      // did the merging.
      workingDraft = {
        ...workingDraft,
        data: withAttachmentIds(assetSync.data, [...mediaSync.fileIds, ...assetSync.fileIds]),
      };
    } catch (error) {
      // The passes collect per-file failures themselves, so reaching here means
      // something below the file loop broke — the media table, a write-back. That
      // is still the worker's problem to own, not the officer's.
      const code = error instanceof ApiError ? error.code : 'unknown';
      const outcome = decideOutcome(code, record.attempts, Date.now());
      const reason = translateApiError(error);
      emit?.({ type: 'report-done', status: outcome.type === 'retry' ? 'retry' : 'rejected', reason });
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
    emit?.({ type: 'report-done', status: 'rejected', reason: mapped.reason });
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
  emit?.({ type: 'phase', phase: 'linking' });
  const roadSnap = await resolveRoadSnap(workingDraft, session);
  const submissionDraft: AccidentDraft =
    roadSnap && !workingDraft.road_snap
      ? { ...workingDraft, road_snap: roadSnap }
      : workingDraft;

  // Which act this is has to be known *before* the payload is assembled, because the
  // two acts do not accept the same keys.
  const submission = pickSubmissionAction(submissionDraft);

  const set: Record<string, unknown> = { ...mapped.set, ...roadFields(roadSnap) };
  if (submission.act === 'update') {
    // `submitted_from` is declared on the `add` validators only — see the comment in
    // back/src/accident/add/add.val.ts. A correction must not restamp the build that
    // originally filed the report, and the server refuses the key outright on update:
    // it is not in that validator, so it arrives as an unknown key and the whole
    // correction is turned away. The report mapper writes this key itself, which is
    // why the removal has to happen here rather than inside either mapper.
    delete set['submitted_from'];
  } else if (provenance && set['submitted_from'] === undefined) {
    // The report mapper already stamps provenance; the accident mapper does not, so
    // this fills it in once for both rather than teaching each mapper the same rule.
    set['submitted_from'] = {
      app_version: provenance.app_version,
      platform: provenance.platform,
    };
  }

  try {
    emit?.({ type: 'phase', phase: 'submitting' });
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
      const result = await handleResubmitAfterSync(session, syncedDraft, record, isReport);
      emit?.({
        type: 'report-done',
        status: result === 'synced' ? 'synced' : result === 'rejected' ? 'rejected' : 'retry',
      });
      return result;
    }
    emit?.({ type: 'report-done', status: 'synced' });
    return 'synced';
  } catch (error) {
    const code = error instanceof ApiError ? error.code : 'unknown';
    const outcome = decideOutcome(code, record.attempts, Date.now());
    const reason =
      outcome.type === 'exhausted'
        ? 'ارسال پس از چند تلاش ناموفق بود؛ دوباره تلاش کنید.'
        : translateApiError(error);

    if (outcome.type === 'retry') {
      emit?.({ type: 'report-done', status: 'retry', reason });
      await persistQueueAndDraft(draft, record, {
        status: 'queued',
        attempts: record.attempts + 1,
        nextRetryAt: outcome.nextRetryAt,
        lastError: reason,
      });
      return 'retry';
    }
    emit?.({ type: 'report-done', status: 'rejected', reason });
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

  async function run(input: SyncRunOptions | boolean = {}): Promise<SyncRunSummary> {
    // `run(true)` is how the background paths and the older screens ask for a manual
    // pass; the options form is what the upload modal drives.
    const options: SyncRunOptions = typeof input === 'boolean' ? { manual: input } : input;
    const manual = options.manual ?? false;
    const summary: SyncRunSummary = {
      processed: 0,
      synced: 0,
      rejected: 0,
      retried: 0,
      started: false,
      blocked: null,
    };
    if (running) {
      return summary;
    }
    running = true;
    summary.started = true;
    try {
      const session = await sessionService.restore();
      if (!session) {
        return block(summary, 'no_session', options.observe);
      }
      const connectivity = await getConnectivitySnapshot();
      if (connectivity.status === 'offline') {
        // Reported rather than silently returned: the officer pressed submit and is
        // watching. Silence here is what left them on a modal that never moved.
        return block(summary, 'offline', options.observe);
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

      const due = reconciled
        .filter(record => isProcessable(record, manual, nowMs))
        // A queue walk shows the officer one report at a time. Letting a second
        // report's events reach the same modal would have the bar jumping between
        // two different file lists.
        .filter(record => !options.onlyDraft || record.client_report_uuid === options.onlyDraft);
      for (const record of due) {
        const result = await processRecord(session, record, options);
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
