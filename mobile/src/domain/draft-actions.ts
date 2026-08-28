import { createAccidentDraft } from './draft-service';
import { formToData, type AccidentFormState } from './accident-form';
import { SYNC_STATUS_LABELS } from './sync-rules';
import type {
  AccidentDraft,
  Coordinates,
  QueueRecord,
  RoadSnap,
  SyncStatus,
  ZoneCheckRecord,
} from '@/domain/types';
import {
  getDraft,
  listDrafts,
  listQueueRecords,
  saveDraft,
  saveQueueRecord,
} from '@/storage/local-database';

export type DraftBoardItem = {
  draft: AccidentDraft;
  queue: QueueRecord | null;
  attempts: number;
  nextRetryAt: string | null;
  lastError: string | null;
  statusLabel: string;
};

export async function loadDraftBoard(): Promise<DraftBoardItem[]> {
  const [drafts, records] = await Promise.all([listDrafts(), listQueueRecords()]);
  return drafts.map(draft => {
    const queue =
      records.find(record => record.client_report_uuid === draft.client_report_uuid) ?? null;
    const status: SyncStatus = queue?.status ?? draft.sync_status;
    return {
      attempts: queue?.attempts ?? 0,
      draft,
      lastError: queue?.last_error ?? draft.rejection_reason ?? null,
      nextRetryAt: queue?.next_retry_at ?? null,
      queue,
      statusLabel: SYNC_STATUS_LABELS[status],
    };
  });
}

export function canManuallyRetry(item: DraftBoardItem): boolean {
  const status = item.queue?.status ?? item.draft.sync_status;
  return status === 'rejected' || status === 'draft' || status === 'queued';
}

export async function requeueDraft(clientReportUuid: string): Promise<void> {
  const now = new Date().toISOString();
  const draft = await getDraft(clientReportUuid);
  if (!draft) {
    return;
  }
  await saveDraft({
    ...draft,
    sync_status: 'queued',
    rejection_reason: undefined,
    updated_at: now,
  });
  const existingQueue = (await listQueueRecords()).find(
    record => record.client_report_uuid === clientReportUuid,
  );
  await saveQueueRecord({
    id: existingQueue?.id ?? `queue-${clientReportUuid}`,
    client_report_uuid: clientReportUuid,
    status: 'queued',
    attempts: 0,
    next_retry_at: undefined,
    last_error: undefined,
    updated_at: now,
  });
}

/**
 * Called when the officer enters the correction flow for a report the expert
 * returned. The flag makes the sync worker call `accident.resubmitReport`
 * after the corrected payload reaches the server.
 */
export async function markDraftReturned(clientReportUuid: string, reason?: string): Promise<void> {
  const draft = await getDraft(clientReportUuid);
  if (!draft) {
    return;
  }
  await saveDraft({
    ...draft,
    updated_at: new Date().toISOString(),
    data: {
      ...draft.data,
      review_status: 'returned',
      ...(reason ? { review_reason: reason } : {}),
    },
  });
}

/** Clears the pending «returned» marker once resubmission succeeded. */
export async function clearDraftReturnedFlag(clientReportUuid: string): Promise<void> {
  const draft = await getDraft(clientReportUuid);
  if (!draft) {
    return;
  }
  const { review_status: _reviewStatus, review_reason: _reviewReason, ...rest } = draft.data;
  await saveDraft({
    ...draft,
    data: rest,
    updated_at: new Date().toISOString(),
  });
}

export async function getOrCreateActiveDraft(): Promise<AccidentDraft> {
  const [drafts, records] = await Promise.all([listDrafts(), listQueueRecords()]);
  const reusable = drafts.find(draft => {
    if (draft.sync_status !== 'draft') {
      return false;
    }
    if (draft.incident_coords || draft.gps_coords) {
      return false;
    }
    const queue = records.find(record => record.client_report_uuid === draft.client_report_uuid);
    return !queue || queue.status === 'draft';
  });
  return reusable ?? createAccidentDraft();
}

export type IncidentLocationPatch = {
  gps_coords: Coordinates | null;
  incident_coords: Coordinates;
  road_snap?: RoadSnap | null;
  gps_unavailable: boolean;
  zone_check?: ZoneCheckRecord | null;
};

export async function saveIncidentLocation(
  clientReportUuid: string,
  patch: IncidentLocationPatch,
): Promise<AccidentDraft | null> {
  const draft = await getDraft(clientReportUuid);
  if (!draft) {
    return null;
  }
  const updated: AccidentDraft = {
    ...draft,
    gps_coords: patch.gps_coords ?? draft.gps_coords,
    incident_coords: patch.incident_coords,
    road_snap: patch.road_snap ?? undefined,
    gps_unavailable: patch.gps_unavailable,
    updated_at: new Date().toISOString(),
    data: {
      ...draft.data,
      ...(patch.zone_check ? { zone_check: patch.zone_check } : {}),
    },
  };
  await saveDraft(updated);
  return updated;
}

export async function saveDraftFormData(
  clientReportUuid: string,
  formData: Record<string, unknown>,
): Promise<AccidentDraft | null> {
  const draft = await getDraft(clientReportUuid);
  if (!draft) {
    return null;
  }
  const updated: AccidentDraft = {
    ...draft,
    // Any saved edit marks the payload dirty; a previously synced report must
    // go back through the sync queue (correction flow), including after a
    // force-close before the exit-time requeue runs.
    sync_status: 'draft',
    updated_at: new Date().toISOString(),
    data: { ...draft.data, ...formData },
  };
  await saveDraft(updated);
  return updated;
}

export function saveFormState(
  clientReportUuid: string,
  state: AccidentFormState,
): Promise<AccidentDraft | null> {
  return saveDraftFormData(clientReportUuid, formToData(state));
}
