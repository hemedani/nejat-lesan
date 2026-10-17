import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submitAccidentReport, updateAccidentReportByUuid } from '@/api/accident';
import { snapPointToRoad, type SnapPointResponse } from '@/api/road';
import { fetchPatrolFormById } from '@/api/form-definition';
import type { AccidentDraft, QueueRecord, Session } from '@/domain/types';
import type { UploadEvent } from '@/domain/upload-events';
import { submitIncidentReport, updateIncidentReportByUuid } from '@/api/incident-report';
import { syncFormAssets } from '@/services/asset-upload-service';
import { syncReportMedia } from '@/services/media-upload-service';

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

let uploadsEnabled = false;

vi.mock('@/config/env', () => ({
  getAppConfig: () => ({
    get uploadsEnabled() {
      return uploadsEnabled;
    },
    appVersion: stubbedAppVersion,
    platform: 'ios' as const,
  }),
}));

let connectivityStatus: 'online' | 'offline' = 'online';

vi.mock('@/services/connectivity', () => ({
  getConnectivitySnapshot: vi.fn(async () => ({ status: connectivityStatus })),
  subscribeToConnectivity: vi.fn(() => () => {}),
}));

// The upload passes report what they sent and what failed, not just the rewritten
// payload, because the worker folds their file ids into `attachmentsIds` and the modal
// needs the failures. Stubbed with the full shape so a change to the contract fails here.
vi.mock('@/services/media-upload-service', () => ({
  syncReportMedia: vi.fn(async (_session: unknown, draft: AccidentDraft) => ({
    data: draft.data,
    uploaded: 0,
    failed: [],
    fileIds: [] as string[],
  })),
}));

// Form-asset uploads ride the same gate as the accident media pipeline; mocked
// so the worker's tests stay free of `expo-file-system`.
vi.mock('@/services/asset-upload-service', () => ({
  syncFormAssets: vi.fn(async (_session: unknown, draft: AccidentDraft) => ({
    data: draft.data,
    uploaded: 0,
    failed: [],
    fileIds: [] as string[],
  })),
}));

vi.mock('@/api/accident-process', () => ({
  fetchPatrolProcess: vi.fn(async () => ({ process: null })),
}));

vi.mock('@/api/form-definition', () => ({
  fetchPatrolFormById: vi.fn(async () => ({ form: null, options: {}, version: { version: 4 } })),
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
  uploadsEnabled = false;
  session = SESSION;
  // Each pass echoes the payload it was handed, the way the real one does after its
  // write-back — a stub that returned `{}` would erase the draft and hide the very
  // mapper behaviour these tests exist to check.
  vi.mocked(syncReportMedia).mockImplementation(async (_session, draft) => ({
    data: draft.data,
    uploaded: 0,
    failed: [],
    fileIds: [],
  }));
  vi.mocked(syncFormAssets).mockImplementation(async (_session, draft) => ({
    data: draft.data,
    uploaded: 0,
    failed: [],
    fileIds: [],
  }));
  connectivityStatus = 'online';
  vi.mocked(fetchPatrolFormById).mockReset().mockResolvedValue({ form: null, options: {}, version: { version: 4 } });
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
    // Assert what it was called *with*, not just that it was called. Counting the
    // calls is what let a payload the server refuses pass through unnoticed: the key
    // `submitted_from` is `add`-only, so every correction carried one.
    expect(vi.mocked(updateAccidentReportByUuid).mock.calls.at(-1)?.[2])
      .not.toHaveProperty('submitted_from');
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

  it('says it did not run when another run already holds the lock', async () => {
    // The lock is what stops two runs double-submitting the same queue. A caller
    // that reported this as "processed 0" would be claiming a run that never
    // happened — and telling an officer there was nothing to send about a queue
    // that is being sent right now.
    let release = () => {};
    vi.mocked(submitAccidentReport).mockImplementation(
      () =>
        new Promise(resolve => {
          release = () => resolve({ _id: 'server-1', report_id: 'REP-1' });
        }),
    );
    enqueue(makeDraft());

    const worker = createSyncWorker();
    const first = worker.run(true);
    // Let the first run reach the submission, so the lock is genuinely held when the
    // second call arrives.
    await vi.waitFor(() => expect(submitAccidentReport).toHaveBeenCalledTimes(1));

    const second = await worker.run(true);
    expect(second.started).toBe(false);
    expect(second.processed).toBe(0);
    expect(submitAccidentReport).toHaveBeenCalledTimes(1);

    release();
    expect((await first).started).toBe(true);
  });

  it('reports that it ran even when there was nothing to do', async () => {
    // "Ran and found nothing" is not the same answer as "did not run", and the
    // queue screen shows them differently.
    const summary = await createSyncWorker().run(true);

    expect(summary.started).toBe(true);
    expect(summary.processed).toBe(0);
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

describe('attachment linking', () => {
  it('puts a croquis sketch in attachmentsIds so the console can show it', async () => {
    uploadsEnabled = true;
    vi.mocked(syncReportMedia).mockImplementation(async (_session, draft) => ({
      data: draft.data,
      uploaded: 1,
      failed: [],
      // A croquis has no card field to ride in, and `uploadAccidentImages` links
      // nothing without an `accidentId` — which a report not yet filed never has.
      fileIds: ['file-croquis'],
    }));
    enqueue(makeDraft());

    await createSyncWorker().run(true);

    const sent = vi.mocked(submitAccidentReport).mock.calls.at(-1)?.[1];
    expect(sent?.['attachmentsIds']).toEqual(['file-croquis']);
  });

  it('puts a non-accident incident photo there too', async () => {
    uploadsEnabled = true;
    vi.mocked(syncReportMedia).mockImplementation(async (_session, draft) => ({
      data: draft.data,
      uploaded: 1,
      failed: [],
      fileIds: ['file-incident-photo'],
    }));
    enqueue(makeDraft());

    await createSyncWorker().run(true);

    const sent = vi.mocked(submitAccidentReport).mock.calls.at(-1)?.[1];
    expect(sent?.['attachmentsIds']).toContain('file-incident-photo');
  });

  it('keeps both passes in one list rather than letting the second overwrite the first', async () => {
    uploadsEnabled = true;
    vi.mocked(syncReportMedia).mockImplementation(async (_session, draft) => ({
      data: draft.data,
      uploaded: 1,
      failed: [],
      fileIds: ['file-croquis'],
    }));
    vi.mocked(syncFormAssets).mockImplementation(async (_session, draft) => ({
      data: draft.data,
      uploaded: 1,
      failed: [],
      fileIds: ['file-form-doc'],
    }));
    enqueue(makeDraft());

    await createSyncWorker().run(true);

    const sent = vi.mocked(submitAccidentReport).mock.calls.at(-1)?.[1];
    expect(sent?.['attachmentsIds']).toEqual(['file-croquis', 'file-form-doc']);
  });

  it('sends no list at all when nothing was uploaded', async () => {
    uploadsEnabled = true;
    enqueue(makeDraft());

    await createSyncWorker().run(true);

    // An empty array would clear the relation on an update rather than leaving it be.
    const sent = vi.mocked(submitAccidentReport).mock.calls.at(-1)?.[1];
    expect(sent).not.toHaveProperty('attachmentsIds');
  });

  it('sends it for a non-accident report too — its model has the relation now', async () => {
    uploadsEnabled = true;
    vi.mocked(syncReportMedia).mockImplementation(async (_session, draft) => ({
      data: draft.data,
      uploaded: 1,
      failed: [],
      fileIds: ['file-obstruction'],
    }));
    enqueue(
      makeDraft({
        incident_type: 'road_obstacle',
        data: { form_definition_id: 'form-1' },
      }),
    );

    await createSyncWorker().run(true);

    // `incident_report` declares `attachments` and both write acts consume one draft's
    // payload, so a road-damage photo reaches the console the same way a croquis does.
    const sent = vi.mocked(submitIncidentReport).mock.calls.at(-1)?.[1];
    expect(sent).toMatchObject({ attachmentsIds: ['file-obstruction'] });
  });
});

describe('narrating a run', () => {
  function collector(): { events: UploadEvent[]; observe: (event: UploadEvent) => void } {
    const events: UploadEvent[] = [];
    return { events, observe: event => void events.push(event) };
  }

  it('forwards the pass\'s own per-file events to the observer', async () => {
    uploadsEnabled = true;
    vi.mocked(syncReportMedia).mockImplementation(async (_session, draft, options) => {
      options?.onProgress?.({
        type: 'file-start',
        mediaId: 'm1',
        name: 'کروکی.jpg',
        index: 0,
        total: 1,
      });
      options?.onProgress?.({ type: 'file-done', mediaId: 'm1', ok: true });
      return { data: draft.data, uploaded: 1, failed: [], fileIds: ['file-croquis'] };
    });
    const { events, observe } = collector();
    enqueue(makeDraft());

    await createSyncWorker().run({ manual: true, observe });

    // The pass owns the per-file events and the worker only passes them on, so the
    // modal is told the same thing the worker knows rather than a summary of it.
    expect(events).toContainEqual({
      type: 'file-start',
      mediaId: 'm1',
      name: 'کروکی.jpg',
      index: 0,
      total: 1,
    });
    expect(events).toContainEqual({ type: 'file-done', mediaId: 'm1', ok: true });
  });

  it('walks the phases in the order the officer sees them', async () => {
    uploadsEnabled = true;
    const { events, observe } = collector();
    enqueue(makeDraft());

    await createSyncWorker().run({ manual: true, observe });

    const phases = events.filter(e => e.type === 'phase').map(e => (e as { phase: string }).phase);
    expect(phases).toEqual(['uploading', 'linking', 'submitting']);
  });

  it('says the report was refused, and why', async () => {
    const { events, observe } = collector();
    // A draft the mapper cannot build is the cleanest refusal to provoke.
    enqueue(makeDraft({ gps_coords: undefined, incident_coords: undefined }));

    await createSyncWorker().run({ manual: true, observe });

    expect(events.find(e => e.type === 'report-done')).toMatchObject({ status: 'rejected' });
  });

  it('works one report at a time when the officer is watching a queue', async () => {
    uploadsEnabled = true;
    const { events, observe } = collector();
    enqueue(makeDraft());
    enqueue(makeDraft({ client_report_uuid: 'uuid-2' }));

    const summary = await createSyncWorker().run({ manual: true, onlyDraft: 'uuid-2', observe });

    // The modal holds one report's file list; a second report's events reaching it
    // would have the bar jumping between two different sweeps.
    expect(summary.processed).toBe(1);
    expect(queueRecords.get('queue-uuid-1')).toMatchObject({ status: 'queued' });
    expect(queueRecords.get('queue-uuid-2')).toMatchObject({ status: 'synced' });
  });

  it('runs silently when nobody is watching, exactly as before', async () => {
    enqueue(makeDraft());
    const summary = await createSyncWorker().run(true);
    expect(summary.synced).toBe(1);
  });
});
describe('a form the organization has replaced', () => {
  it('holds a draft whose captured version the organization moved on from', async () => {
    // The device keeps one copy of each form — the newest — so an officer who
    // answered offline can reach submit holding answers shaped by questions the org
    // no longer publishes. Filing them would submit against a dead workflow.
    vi.mocked(fetchPatrolFormById).mockResolvedValue({
      form: null,
      options: {},
      version: { version: 9 },
    });
    enqueue(makeDraft({ data: { form_definition_id: 'fd-1', form_version: 4, form_answers: {} } }));

    const summary = await createSyncWorker().run(true);

    expect(summary.synced).toBe(0);
    expect(queueRecords.get('queue-uuid-1')).toMatchObject({ status: 'queued' });
    expect(submitAccidentReport).not.toHaveBeenCalled();
    expect(queueRecords.get('queue-uuid-1')?.['last_error']).toContain('فرم ثبت سازمان به‌روزرسانی شده است');
  });

  it('sends the draft when the captured version is still the active one', async () => {
    enqueue(makeDraft({ data: { form_definition_id: 'fd-1', form_version: 4, form_answers: {} } }));

    const summary = await createSyncWorker().run(true);

    expect(summary.synced).toBe(1);
  });

  it('never asks about a draft the built-in wizards filed', async () => {
    // Those snapshot no `form_version`, so gating them would hold every standard
    // report forever.
    enqueue(makeDraft({ data: { location: 'بزرگراه' } }));

    await createSyncWorker().run(true);

    expect(fetchPatrolFormById).not.toHaveBeenCalled();
  });

  it('does not hold the report while offline', async () => {
    // The officer cannot reopen anything out of coverage, so a hold would strand a
    // finished report with no way to clear it.
    connectivityStatus = 'offline';
    vi.mocked(fetchPatrolFormById).mockResolvedValue({
      form: null,
      options: {},
      version: { version: 9 },
    });
    enqueue(makeDraft({ data: { form_definition_id: 'fd-1', form_version: 4, form_answers: {} } }));

    // Offline the whole run is skipped, which is itself the guarantee: nothing is
    // held, and nothing is attempted.
    const summary = await createSyncWorker().run(true);

    expect(summary.processed).toBe(0);
    expect(queueRecords.get('queue-uuid-1')).toMatchObject({ status: 'queued' });
  });
});

describe('a run that never started', () => {
  it('says the device is offline instead of returning a run that did nothing', async () => {
    connectivityStatus = 'offline';
    enqueue(makeDraft());

    const summary = await createSyncWorker().run(true);

    // The counts alone cannot say why: a run that found an empty queue looks identical.
    // This is what lets the modal end instead of spinning at 0% forever.
    expect(summary.blocked).toBe('offline');
  });

  it('tells the observer the report is saved and waiting', async () => {
    connectivityStatus = 'offline';
    enqueue(makeDraft());
    const events: UploadEvent[] = [];

    await createSyncWorker().run({ manual: true, observe: event => void events.push(event) });

    // Without this event the modal stayed in `planning`, which renders as a busy
    // spinner with no error and no buttons.
    expect(events).toContainEqual({ type: 'deferred', reason: expect.any(String) });
  });

  it('says so when there is no session to send with', async () => {
    // Same dead end, different cause: the modal would hang exactly the same way.
    connectivityStatus = 'online';
    session = null;
    enqueue(makeDraft());

    const summary = await createSyncWorker().run(true);

    expect(summary.blocked).toBe('no_session');
  });

  it('reports no block at all on an ordinary run', async () => {
    enqueue(makeDraft());

    const summary = await createSyncWorker().run(true);

    expect(summary.blocked).toBeNull();
    expect(summary.synced).toBe(1);
  });

  it('says another run holds the lock rather than calling that a block', async () => {
    // `started: false` is a different answer — the queue is being worked right now, by
    // somebody else. Collapsing it into `blocked` would tell the officer their report
    // was parked.
    let release = () => {};
    vi.mocked(submitAccidentReport).mockImplementation(
      () =>
        new Promise(resolve => {
          release = () => resolve({ _id: 'server-1', report_id: 'REP-1' });
        }),
    );
    enqueue(makeDraft());

    const worker = createSyncWorker();
    const first = worker.run(true);
    await vi.waitFor(() => expect(submitAccidentReport).toHaveBeenCalledTimes(1));
    const second = await worker.run(true);

    expect(second).toMatchObject({ started: false, blocked: null });
    release();
    await first;
  });
});

describe('the offline submit, end to end through the modal\'s own state machine', () => {
  it('ends in a saved, closable state instead of a 0% spinner with no buttons', async () => {
    // Each link is unit-tested on its own; this one exists because the event name is a
    // string literal on both sides. Nothing checks that the worker *speaks* a name the
    // reducer *hears* — they drifted silently once already, and the symptom was an
    // officer trapped on a modal.
    connectivityStatus = 'offline';
    enqueue(makeDraft());
    const events: UploadEvent[] = [];

    const summary = await createSyncWorker().run({ manual: true, observe: event => void events.push(event) });

    // What `useReportUpload` does with them, run through the real reducer.
    const progress = events.reduce(applyUploadEvent, initialUploadProgress());
    const outcome = resolveSendOutcome({
      blocked: summary.blocked,
      phase: progress.phase,
      synced: summary.synced,
    });

    expect(progress.phase).toBe('queued');
    expect(progress.reason).toContain('ذخیره شد');
    expect(outcome).toBe('queued');
    // `queued` settles the modal, which is what puts a «بستن» button on screen.
    expect(['done', 'queued', 'failed']).toContain(progress.phase);
  });

  it('never leaves the officer believing an unsent report was filed', async () => {
    connectivityStatus = 'offline';
    enqueue(makeDraft());
    const events: UploadEvent[] = [];

    await createSyncWorker().run({ manual: true, observe: event => void events.push(event) });

    const progress = events.reduce(applyUploadEvent, initialUploadProgress());
    // `done` renders a green «با موفقیت ثبت شد» for a report the server never received.
    expect(progress.phase).not.toBe('done');
  });
});

