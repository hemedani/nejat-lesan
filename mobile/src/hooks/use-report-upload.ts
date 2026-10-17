import { useCallback, useRef, useState } from 'react';

import { requeueDraft } from '@/domain/draft-actions';
import {
  applyUploadEvent,
  initialUploadProgress,
  resolveSendOutcome,
  skipSetOf,
  skippedFilesField,
  type UploadEvent,
  type UploadProgress,
} from '@/domain/upload-events';
import { getSyncWorker } from '@/services/sync-worker';
import { getDraft, saveDraft } from '@/storage/local-database';

/**
 * Drives one report's final submission while an officer watches it.
 *
 * The work is the sync worker's — this hook submits nothing itself. It hands the worker an
 * observer and folds what comes back into a progress value for the modal. That split is
 * why there is no second submit path to keep in step: the sequence that uploads, links and
 * files a report is the same one the background worker runs when nobody is watching.
 *
 * What the hook does own is the conversation. A file that will not upload holds the
 * sequence at `attention` and waits here for one of three answers, each of which restarts
 * the same worker call with different instructions. Nothing is decided on the officer's
 * behalf and nothing is dropped without being recorded.
 */

/**
 * `queued` is not a failure: the report was saved and is waiting for a connection, so
 * the modal ends in a settled «ذخیره شد» state and the queue picks it up on its own.
 */
export type SendResult = 'synced' | 'queued' | 'failed' | 'cancelled' | 'busy' | 'attention';

export type UseReportUpload = {
  visible: boolean;
  progress: UploadProgress;
  /**
   * Whether a run is in flight right now.
   *
   * Separate from `visible` on purpose: the officer can send a queue into the background
   * and keep browsing, and the button must keep spinning while it works.
   */
  running: boolean;
  /** Send one report now, or a queue of them one at a time. */
  send: (uuids: string[]) => Promise<SendResult>;
  /** «تلاش دوباره» — re-run with the same skip set. */
  retry: () => void;
  /** «ادامه بدون این فایل» — record the omission, then file the report without those files. */
  skipFailed: () => void;
  /** «انصراف» — abandon; the draft stays queued and nothing is submitted. */
  cancel: () => void;
  /** «ادامه در پس‌زمینه» — hide the modal, let the queue carry on. */
  dismiss: () => void;
  /** «بستن» on a settled run. */
  close: () => void;
};

export function useReportUpload(
  options: { onSettled?: () => void } = {},
): UseReportUpload {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>(initialUploadProgress);
  const [running, setRunning] = useState(false);

  const queueRef = useRef<string[]>([]);
  const skippedRef = useRef<ReadonlySet<string>>(new Set<string>());
  // A mirror of `progress` the async paths can read. React state is not available inside a
  // callback that closes over an earlier render, and the run loop needs the *settled* value
  // after it awaits — a ref is the only thing that is current by then.
  const progressRef = useRef<UploadProgress>(progress);

  const emit = useCallback((event: UploadEvent) => {
    setProgress(current => {
      const next = applyUploadEvent(current, event);
      progressRef.current = next;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = initialUploadProgress();
    progressRef.current = fresh;
    setProgress(fresh);
  }, []);

  const runOnce = useCallback(async (): Promise<SendResult> => {
    const uuid = queueRef.current[0];
    if (!uuid) {
      return 'cancelled';
    }

    const summary = await getSyncWorker().run({
      manual: true,
      onlyDraft: uuid,
      observe: emit,
      skipUploads: skippedRef.current,
    });

    // Another run held the lock. Saying so beats a modal that never moves and an officer
    // who taps «تلاش دوباره» into the same wall.
    if (!summary.started) {
      return 'busy';
    }

    const outcome = resolveSendOutcome({
      blocked: summary.blocked,
      phase: progressRef.current.phase,
      synced: summary.synced,
    });

    // The officer is being asked about a file, or the report is parked, so the queue
    // must not advance past it — the next one would open its own modal on top of an
    // unresolved question or an unsent report.
    if (outcome === 'attention' || outcome === 'queued') {
      return outcome;
    }

    queueRef.current = queueRef.current.slice(1);
    return outcome;
  }, [emit]);

  const drive = useCallback(async (): Promise<SendResult> => {
    setRunning(true);
    let last: SendResult = 'cancelled';
    try {
      while (queueRef.current.length > 0) {
        last = await runOnce();
        if (last !== 'synced') {
          break;
        }
      }
      if (last === 'queued') {
        // The report is safe and pending. The drafts board re-reads `sync_status`, so
        // calling `onSettled` here is what makes it show up as waiting rather than
        // stuck at whatever it last rendered.
        options.onSettled?.();
      } else if (last === 'busy') {
        setProgress(current => {
          const next: UploadProgress = {
            ...current,
            phase: 'failed',
            reason: 'یک ارسال دیگر در جریان است؛ کمی بعد دوباره تلاش کنید.',
          };
          progressRef.current = next;
          return next;
        });
      } else if (last !== 'attention') {
        options.onSettled?.();
      }
      return last;
    } finally {
      setRunning(false);
    }
  }, [options, runOnce]);

  const send = useCallback(
    async (uuids: string[]): Promise<SendResult> => {
      if (uuids.length === 0) {
        return 'cancelled';
      }
      for (const uuid of uuids) {
        await requeueDraft(uuid);
      }
      queueRef.current = [...uuids];
      skippedRef.current = new Set<string>();
      reset();
      setVisible(true);
      return drive();
    },
    [drive, reset],
  );

  const rerun = useCallback(
    (skip: ReadonlySet<string>) => {
      skippedRef.current = skip;
      reset();
      setVisible(true);
      void drive();
    },
    [drive, reset],
  );

  const retry = useCallback(() => {
    // The same skip set: a failed file has no `server_file_id`, so re-running sends it
    // and leaves the ones that already landed alone.
    rerun(skippedRef.current);
  }, [rerun]);

  const skipFailed = useCallback(() => {
    const uuid = queueRef.current[0];
    void recordSkippedFiles(uuid, progressRef.current).then(() => {
      rerun(skipSetOf(progressRef.current));
    });
  }, [rerun]);

  const cancel = useCallback(() => {
    // Nothing was submitted, so the drafts stay exactly as they were — queued, with their
    // files on disk. That is what cancelling means: the officer walks away with work still
    // to do rather than a report they did not mean to file.
    queueRef.current = [];
    setVisible(false);
    reset();
  }, [reset]);

  const dismiss = useCallback(() => {
    // The queue keeps running. The drafts board re-reads `sync_status`, so the real state
    // is visible there even though the modal is gone.
    setVisible(false);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    reset();
    options.onSettled?.();
  }, [options, reset]);

  return { visible, progress, running, send, retry, skipFailed, cancel, dismiss, close };
}

/**
 * Record the files the officer chose to leave behind, before the report is filed.
 *
 * Without this the console cannot tell a report filed with missing evidence from one that
 * was never given it — the two look identical, and the second is a bug nobody reports.
 * Written before the re-run on purpose: the run that follows reloads the draft from
 * SQLite, so anything not persisted first is not in the payload it sends.
 */
async function recordSkippedFiles(
  uuid: string | undefined,
  state: UploadProgress,
): Promise<void> {
  const field = skippedFilesField(state);
  if (!uuid || Object.keys(field).length === 0) {
    return;
  }
  const draft = await getDraft(uuid);
  if (!draft) {
    return;
  }
  await saveDraft({
    ...draft,
    data: { ...draft.data, ...field },
    updated_at: new Date().toISOString(),
  });
}