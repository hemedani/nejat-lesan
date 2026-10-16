/**
 * What the officer sees while a report's files go up.
 *
 * The upload itself is not new — `syncReportMedia` and `syncFormAssets` have always run
 * before the submit act, one file at a time. What was missing is any way to *watch* it:
 * over station wi-fi a five-file report is a couple of minutes of an unresponsive screen,
 * and the first failure used to abandon the whole run with no explanation.
 *
 * So the pipeline publishes what it is already doing, and this module is the one place
 * that decides what that means. Events arrive in order and are folded into a single
 * progress value; the modal renders that value and sequences nothing itself. Keeping the
 * bookkeeping pure and free of React and native imports is what makes the whole state
 * machine testable in the project's `node` vitest environment, with no device and no
 * backend.
 */

/** The stages between "officer pressed submit" and "the server has it". */
export type UploadPhase =
  | 'planning'
  | 'uploading'
  | 'linking'
  | 'submitting'
  | 'attention'
  | 'done'
  | 'failed';

export type FailedUpload = {
  mediaId: string;
  name: string;
  reason: string;
};

export type UploadProgress = {
  phase: UploadPhase;
  /** Files finished, successfully or not. Drives the progress bar. */
  done: number;
  /** Files known so far; zero until the first `file-start` announces the count. */
  total: number;
  /** The file in flight, or null between files and after the sequence ends. */
  current: string | null;
  failed: FailedUpload[];
  /** Why the report itself did not go through, when it did not. */
  reason: string | null;
  percent: number;
};

/**
 * What the worker tells the UI. `report-done` carries the same three outcomes
 * `processRecord` returns, so the modal and the queue record can never disagree about
 * what happened.
 */
export type UploadEvent =
  | { type: 'phase'; phase: UploadPhase }
  | { type: 'file-start'; mediaId: string; name: string; index: number; total: number }
  | { type: 'file-done'; mediaId: string; ok: boolean }
  | { type: 'file-failed'; mediaId: string; name: string; reason: string }
  | { type: 'failures-resolved'; skip: string[] }
  | { type: 'report-done'; status: 'synced' | 'rejected' | 'retry'; reason?: string };

export function initialUploadProgress(): UploadProgress {
  return {
    phase: 'planning',
    done: 0,
    total: 0,
    current: null,
    failed: [],
    reason: null,
    percent: 0,
  };
}

/**
 * Phases that mean the modal must stop moving on its own.
 *
 * `attention` is the important one: the officer has to choose between retry, skip and
 * cancel, and nothing may drag the modal forward until they do.
 */
const HELD_PHASES: ReadonlySet<UploadPhase> = new Set<UploadPhase>(['attention', 'done', 'failed']);

function percentOf(done: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((done / total) * 100));
}

function withPercent(state: UploadProgress): UploadProgress {
  return { ...state, percent: percentOf(state.done, state.total) };
}

export function applyUploadEvent(state: UploadProgress, event: UploadEvent): UploadProgress {
  // Entering `uploading` means a new attempt, so it is answered before the hold: a retry
  // restarts the modal from a state that is still `attention`.
  if (event.type === 'phase' && event.phase === 'uploading') {
    return withPercent({ ...initialUploadProgress(), phase: 'uploading' });
  }

  if (HELD_PHASES.has(state.phase)) {
    // `failures-resolved` is the officer's answer, so it has to get through the hold —
    // that is what lets the held sequence carry on to the submit.
    if (event.type === 'failures-resolved') {
      return withPercent({ ...state, failed: [], phase: 'uploading' });
    }
    return state;
  }

  switch (event.type) {
    case 'phase':
      // The file sweep is over but something failed in it. Hold here rather than walking
      // on into a submit the officer has not agreed to — the choice is theirs, and it is
      // the only moment they can still see which evidence is about to be left behind.
      if ((event.phase === 'linking' || event.phase === 'submitting') && state.failed.length > 0) {
        return { ...state, phase: 'attention' };
      }
      return { ...state, phase: event.phase };

    case 'file-start':
      return withPercent({
        ...state,
        phase: 'uploading',
        total: event.total,
        current: event.name,
      });

    case 'file-done':
      return withPercent({
        ...state,
        done: state.done + 1,
        current: null,
      });

    // A bad file does not end the sweep. The services keep going so one unreadable
    // photo cannot strand the other four, and every failure is reported before the
    // officer is asked to decide anything.
    case 'file-failed':
      return withPercent({
        ...state,
        done: state.done + 1,
        current: null,
        failed: state.failed.some(entry => entry.mediaId === event.mediaId)
          ? state.failed.map(entry =>
              entry.mediaId === event.mediaId ? { ...entry, reason: event.reason } : entry,
            )
          : [...state.failed, { mediaId: event.mediaId, name: event.name, reason: event.reason }],
      });

    case 'failures-resolved':
      return withPercent({ ...state, failed: [], phase: 'uploading' });

    case 'report-done':
      if (event.status === 'synced') {
        return withPercent({ ...state, phase: 'done', current: null, reason: null });
      }
      // A `retry` is not a failure the officer caused — the draft stays queued and the
      // background worker will come back to it. Showing a reason would be inventing one.
      return withPercent({
        ...state,
        phase: 'failed',
        current: null,
        reason: event.status === 'rejected' ? (event.reason ?? null) : null,
      });
  }
}

/**
 * The media ids the officer chose to skip.
 *
 * A skip is a decision to file the report without that file, so it must be handed back to
 * the upload pass as a set of ids to leave alone — otherwise «ادامه بدون این فایل» would
 * simply retry the file that just failed.
 */
export function skipSetOf(state: UploadProgress): Set<string> {
  return new Set(state.failed.map(entry => entry.mediaId));
}

/**
 * The skipped files, recorded on the payload so the console can tell a report filed with
 * missing evidence from one that was never given it. Naming them is the whole point of
 * making the officer decide rather than the app deciding for them.
 */
export function skippedFilesField(state: UploadProgress): Record<string, unknown> {
  if (state.failed.length === 0) {
    return {};
  }
  return {
    skipped_files: state.failed.map(entry => ({ name: entry.name, reason: entry.reason })),
  };
}