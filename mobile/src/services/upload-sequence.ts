import { translateApiError } from '@/api/errors';

import type { FailedUpload } from '@/domain/upload-events';

/**
 * The one-file-at-a-time sweep shared by both upload pipelines.
 *
 * `syncReportMedia` and `syncFormAssets` have always run before the submit act, but they
 * did it as two near-identical private loops, and neither could be watched: the officer
 * saw an unresponsive screen for the length of the upload, and the first bad file threw
 * out of the whole run. Both problems live here, once, so the two services stay thin and
 * neither can drift into a different failure policy than the other.
 *
 * Two rules earn their keep:
 *
 * - **A bad file does not end the sweep.** The failure is collected and the loop moves on,
 *   so one unreadable photo cannot strand the four that are fine. The caller decides what
 *   a partial result means; this function only refuses to throw.
 * - **The reason is translated here, not by the caller.** A raw backend string must never
 *   reach an officer, and the caller is a UI component that has no business importing the
 *   error layer.
 */

export type UploadSequenceItem = {
  /** The local media record id — what `skip` names and what the observer reports. */
  id: string;
  /** The name to show the officer. Never a raw local path. */
  name: string;
  /** Already on the server? If so there is nothing to send and nothing to announce. */
  serverFileId?: string;
};

export type UploadSequenceHooks<T> = {
  onFileStart?: (item: T, index: number, total: number) => void;
  onFileDone?: (item: T, fileId: string) => void;
  onFileFailed?: (item: T, reason: string) => void;
  /** Called with the server id so it survives a crash before the report is filed. */
  persistFileId?: (item: T, fileId: string) => Promise<void>;
};

export type UploadSequenceResult = {
  /** record id → server file id, for every file known to be on the server. */
  fileIds: Map<string, string>;
  uploaded: number;
  failed: FailedUpload[];
};

/**
 * @param skip record ids the officer chose to leave behind on a previous attempt.
 */
export async function runUploadSequence<T extends UploadSequenceItem>(
  records: T[],
  upload: (record: T) => Promise<string>,
  hooks: UploadSequenceHooks<T> = {},
  skip: ReadonlySet<string> = new Set<string>(),
): Promise<UploadSequenceResult> {
  const fileIds = new Map<string, string>();
  const failed: FailedUpload[] = [];
  const pending = records.filter(record => !skip.has(record.id));
  const total = pending.length;
  let uploaded = 0;

  for (let index = 0; index < pending.length; index += 1) {
    const record = pending[index];

    // A file an earlier attempt already got through is not re-sent and not announced:
    // counting it again would make the progress bar jump and then stall.
    if (record.serverFileId) {
      fileIds.set(record.id, record.serverFileId);
      continue;
    }

    hooks.onFileStart?.(record, index, total);
    try {
      const fileId = await upload(record);
      await hooks.persistFileId?.(record, fileId);
      fileIds.set(record.id, fileId);
      uploaded += 1;
      hooks.onFileDone?.(record, fileId);
    } catch (error) {
      const reason = translateApiError(error);
      failed.push({ mediaId: record.id, name: record.name, reason });
      hooks.onFileFailed?.(record, reason);
    }
  }

  return { fileIds, uploaded, failed };
}