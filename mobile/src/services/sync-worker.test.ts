import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submitAccidentReport, updateAccidentReportByUuid } from '@/api/accident';
import { snapPointToRoad, type SnapPointResponse } from '@/api/road';
import type { AccidentDraft, QueueRecord, Session } from '@/domain/types';

import { createSyncWorker } from './sync-worker';

/**
 * The worker reads and writes SQLite through `@/storage/local-database`, so the
 * whole run loop is driven here against in-memory maps — the same stand-in the
 * draft-service tests use. Everything else (connectivity, the HTTP layer, the
 * session store) is mocked because those modules pull in Expo native code.
 */
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

// `appVersion` drives the provenance the backend uses to link a report to the
// filing organization. Stubbed here so the worker's tests stay free of native
// imports and can assert on the exact version that would be sent.
let stubbedAppVersion = '1.4.2';

vi.mock('@/config/env', () => ({
  getAppConfig: () => ({
    uploadsEnabled: false,
    appVersion: stubbedAppVersion,
    platform: 'ios' as const,
  }),
}));

let connectivityStatus: 'online' | 'offline' = 'online';

vi.mock('@/services/connectivity', () => ({
  getConnectivitySnapshot: vi.fn(async () => ({ status: connectivityStatus })),
  subscribeToConnectivity: vi.fn(() => () => {}),
}));

vi.mock('@/services/media-upload-service', () => ({
  syncReportMedia: vi.fn(async (_session: unknown, draft: AccidentDraft) => ({ data: draft.data })),
}));

vi.mock('@/api/accident-process', () => ({
  fetchPatrolProcess: vi.fn(async () => ({ process: null })),
}));

vi.mock('@/api/road', () => ({
  snapPointToRoad: vi.fn(),
}));

vi.mock('@/api/accident', () => ({
  resubmitReturnedReport: vi.fn(async () => ({ report_id: 'REP-1' })),
  submitAccidentReport: vi.fn(),
  updateAccidentReportByUuid: vi.fn(),
}));

vi.mock('@/api/incident-report', () => ({
  resubmitReturnedIncidentReport: vi.fn(async () => ({ report_id: 'INC-1' })),
  submitIncidentReport: vi.fn(),
  updateIncidentReportByUuid: vi.fn(),
}));

vi.mock('@/auth/session-service', () => ({
  createSessionService: () => ({ restore: async () => session }),
}));

vi.mock('@/domain/draft-actions', () => ({
  clearDraftReturnedFlag: vi.fn(async () => undefined),
}));

const SESSION: Session = {
  device_id: 'device-1',
  token: 'token-1',
  user: { _id: 'user-1', first_name: 'مأمور', last_name: 'گشت' },
};

const SNAP_RESPONSE: SnapPointResponse = {
  direction: 'north',
  distanceToRoadMeters: 12.5,
  fromOriginMeters: 42_350,
  kilometer: 42,
  lanes: [],
  nearestPoint: { coordinates: [51.4, 35.7], type: 'Point' },
  road: { _id: 'road-9', name: 'بزرگراه شهید همت' },
  meter: 350,
  totalLengthMeters: 100_000,
};

let session: Session | null = SESSION;

function makeDraft(overrides: Partial<AccidentDraft> = {}): AccidentDraft {
  return {
    client_report_uuid: 'uuid-1',
    data: {},
    incident_coords: { latitude: 35.71, longitude: 51.41 },
    schema_version: 1,
    sync_status: 'queued',
    updated_at: '2026-09-18T10:00:00.000Z',
    ...overrides,
  };
}

/** Mirrors what finishing a capture leaves behind: a draft plus a queued record. */
function enqueue(draft: AccidentDraft): void {
  drafts.set(draft.client_report_uuid, { ...draft });
  queueRecords.set(`queue-${draft.client_report_uuid}`, {
    attempts: 0,
    client_report_uuid: draft.client_report_uuid,
    id: `queue-${draft.client_report_uuid}`,
    status: 'queued',
    updated_at: '2026-09-18T10:00:00.000Z',
  } satisfies QueueRecord);
}

/** The set handed to `accident.add` / `accident.update`. */
function submittedSet(callIndex = 0): Record<string, unknown> {
  return vi.mocked(submitAccidentReport).mock.calls[callIndex][1];
}

beforeEach(() => {
  drafts.clear();
  queueRecords.clear();
  stubbedAppVersion = '1.4.2';
  session = SESSION;
  connectivityStatus = 'online';
  vi.mocked(snapPointToRoad).mockReset();
  vi.mocked(submitAccidentReport).mockReset().mockResolvedValue({ _id: 'server-1', report_id: 'REP-1' });
  vi.mocked(updateAccidentReportByUuid)
    .mockReset()
    .mockResolvedValue({ _id: 'server-1', report_id: 'REP-1' });
});

describe('deferred road snap', () => {
  it('resolves the road at submit time when the pin was confirmed offline', async () => {
    // The location picker promises «اطلاعات راه پس از اتصال تکمیل میشود» and
    // stores no snap when the officer confirms without a connection. Nothing
    // used to resolve it, so the road reference was lost for good.
    vi.mocked(snapPointToRoad).mockResolvedValue(SNAP_RESPONSE);
    enqueue(makeDraft());

    const summary = await createSyncWorker().run(true);

    expect(summary).toMatchObject({ processed: 1, synced: 1 });
    expect(snapPointToRoad).toHaveBeenCalledTimes(1);
    expect(vi.mocked(snapPointToRoad).mock.calls[0][0]).toEqual({
      latitude: 35.71,
      longitude: 51.41,
    });
    expect(submittedSet()).toMatchObject({
      kilometer: 42,
      meter: 350,
      roadId: 'road-9',
      travel_direction: 'north',
    });
  });

  it('persists the resolved snap on the draft', async () => {
    vi.mocked(snapPointToRoad).mockResolvedValue(SNAP_RESPONSE);
    enqueue(makeDraft());

    await createSyncWorker().run(true);

    expect(drafts.get('uuid-1')?.['road_snap']).toMatchObject({
      kilometer: 42,
      road_id: 'road-9',
    });
  });

  it('still submits when the road service fails', async () => {
    // Best-effort by contract: the officer was told they could continue without
    // the road, so a failed lookup must never block the report.
    vi.mocked(snapPointToRoad).mockRejectedValue(new Error('road service down'));
    enqueue(makeDraft());

    const summary = await createSyncWorker().run(true);

    expect(summary.synced).toBe(1);
    const set = submittedSet();
    expect(set).not.toHaveProperty('roadId');
    expect(set).not.toHaveProperty('kilometer');
    expect(set['location']).toEqual({ coordinates: [51.41, 35.71], type: 'Point' });
  });

  it('never calls the road service for a pin that already has a road', async () => {
    vi.mocked(snapPointToRoad).mockResolvedValue(SNAP_RESPONSE);
    enqueue(makeDraft({ road_snap: { kilometer: 7, road_id: 'road-keep' } }));

    await createSyncWorker().run(true);

    expect(snapPointToRoad).not.toHaveBeenCalled();
    expect(submittedSet()).toMatchObject({ kilometer: 7, roadId: 'road-keep' });
  });

  it('reuses the stored snap when an edited report is resubmitted', async () => {
    vi.mocked(snapPointToRoad).mockResolvedValue(SNAP_RESPONSE);
    const worker = createSyncWorker();
    enqueue(makeDraft());
    await worker.run(true);

    // Officer reopens the synced report, edits it and finishes again: the draft
    // goes back to `draft`, so the queue record must re-enter the run loop.
    drafts.set('uuid-1', { ...drafts.get('uuid-1'), sync_status: 'draft' });
    await worker.run(true);

    expect(snapPointToRoad).toHaveBeenCalledTimes(1);
    expect(updateAccidentReportByUuid).toHaveBeenCalledTimes(1);
  });

  it('falls back to the officer GPS when no incident pin was chosen', async () => {
    vi.mocked(snapPointToRoad).mockResolvedValue(SNAP_RESPONSE);
    enqueue(makeDraft({ gps_coords: { latitude: 35.8, longitude: 51.5 }, incident_coords: undefined }));

    await createSyncWorker().run(true);

    expect(vi.mocked(snapPointToRoad).mock.calls[0][0]).toEqual({
      latitude: 35.8,
      longitude: 51.5,
    });
    expect(submittedSet()).toMatchObject({ roadId: 'road-9' });
  });

  it('does not call the road service when the draft carries no coordinates', async () => {
    enqueue(makeDraft({ gps_coords: undefined, incident_coords: undefined }));

    const summary = await createSyncWorker().run(true);

    expect(summary.rejected).toBe(1);
    expect(snapPointToRoad).not.toHaveBeenCalled();
    expect(submitAccidentReport).not.toHaveBeenCalled();
  });

  it('does nothing at all while offline', async () => {
    connectivityStatus = 'offline';
    enqueue(makeDraft());

    const summary = await createSyncWorker().run(true);

    expect(summary.processed).toBe(0);
    expect(snapPointToRoad).not.toHaveBeenCalled();
    expect(submitAccidentReport).not.toHaveBeenCalled();
  });
});

describe('submission outcome bookkeeping', () => {
  it('marks the draft and its queue record as synced on success', async () => {
    enqueue(makeDraft());

    await createSyncWorker().run(true);

    expect(drafts.get('uuid-1')).toMatchObject({
      report_id: 'REP-1',
      server_id: 'server-1',
      sync_status: 'synced',
    });
    expect(queueRecords.get('queue-uuid-1')).toMatchObject({ attempts: 1, status: 'synced' });
  });

  it('stamps the running build on the payload so the backend can link the organization', async () => {
    enqueue(makeDraft());

    await createSyncWorker().run(true);

    // The backend treats `submitted_from` as "this came from the app", snapshots the
    // version, and resolves the filing organization from the session itself.
    const sent = vi.mocked(submitAccidentReport).mock.calls.at(-1)?.[1];
    expect(sent).toMatchObject({
      submitted_from: { app_version: '1.4.2', platform: 'ios' },
    });
  });

  it('omits provenance when the running version cannot be determined', async () => {
    stubbedAppVersion = '0.0.0';
    enqueue(makeDraft());

    await createSyncWorker().run(true);

    // Never stamp a guess: an unknown version must not be reported as one, and the
    // absence is what keeps the report out of the app-submitted population.
    const sent = vi.mocked(submitAccidentReport).mock.calls.at(-1)?.[1];
    expect(sent).not.toHaveProperty('submitted_from');
  });

  it('rejects a draft the mapper cannot build instead of retrying it forever', async () => {
    enqueue(makeDraft({ gps_coords: undefined, incident_coords: undefined }));

    await createSyncWorker().run(true);

    expect(queueRecords.get('queue-uuid-1')).toMatchObject({ status: 'rejected' });
    expect(drafts.get('uuid-1')?.['rejection_reason']).toContain('موقعیت');
  });
});
