import { File } from 'expo-file-system';

import { uploadAccidentImage } from '@/api/media';
import { applyServerFileIds, type MediaUploadResult } from '@/domain/media-writeback';
import type { FailedUpload } from '@/domain/upload-events';
import type { AccidentDraft, Session } from '@/domain/types';
import type { MediaCategory } from '@/services/media-service';
import type { MediaRecord } from '@/storage/local-database';
import { listMedia, updateMediaMetadata } from '@/storage/local-database';
import { runUploadSequence, type UploadSequenceItem } from '@/services/upload-sequence';

import type { UploadOptions } from './upload-options';

export type ReportMediaSyncResult = {
  data: Record<string, unknown>;
  uploaded: number;
  failed: FailedUpload[];
  /**
   * Every server file id this draft owns, whatever the category.
   *
   * The console's gallery is built from the `attachments` relation, and that relation is
   * the *only* way a file becomes visible. `applyServerFileIds` links plate, insurance and
   * damage photos through their typed card fields, but a croquis sketch or an incident
   * photo has no such field — and `file.uploadAccidentImages` links nothing at all when
   * no `accidentId` is sent, which is every new report. Left alone they upload, vanish,
   * and are later reaped as orphans. Collecting them here is what stops that.
   */
  fileIds: string[];
};

function serverFileId(record: MediaRecord): string | undefined {
  const value = (record.metadata as Record<string, unknown> | undefined)?.['server_file_id'];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * A not-yet-uploaded record that belongs to the accident wizard's fixed media slots.
 *
 * A dynamic form's `file` fields store their captures under the `asset` category, which
 * this pipeline does not own: they can be videos and documents, which
 * `file.uploadAccidentImages` rejects, so they are uploaded by `syncFormAssets` through
 * the general file act instead.
 */
const isPendingWizardMedia = (record: MediaRecord): boolean =>
  record.category !== 'asset' && serverFileId(record) === undefined;

async function readBase64(record: MediaRecord): Promise<string> {
  const file = new File(record.local_uri);
  const base64 = await file.base64();
  // Some platform paths may surface a data-URL prefix; the wire format needs raw base64.
  return base64.replace(/^data:[^;]+;base64,/, '');
}

/**
 * A media row as the sweep sees it.
 *
 * `MediaRecord` has no display name — the file on disk is named after the record id — so
 * one is derived here rather than reaching into the record and hoping every caller
 * remembers to.
 */
type MediaSequenceItem = UploadSequenceItem & { record: MediaRecord };

function toSequenceItem(record: MediaRecord): MediaSequenceItem {
  const stored = (record.metadata as Record<string, unknown> | undefined)?.['file_name'];
  const name = typeof stored === 'string' && stored.length > 0 ? stored : `${record.id}.jpg`;
  return { id: record.id, name, record, serverFileId: serverFileId(record) };
}

/**
 * Uploads every not-yet-uploaded media record of a report and writes the returned server
 * file `_id`s back into the draft payload. Idempotent: records already carrying a
 * `server_file_id` are skipped.
 *
 * A file that will not upload is collected rather than thrown, so one bad photo cannot
 * abandon the rest — the caller decides what a partial result means. Callers gate this
 * behind the upload contract flag.
 */
export async function syncReportMedia(
  session: Session,
  draft: AccidentDraft,
  options: UploadOptions = {},
): Promise<ReportMediaSyncResult> {
  const media = await listMedia(draft.client_report_uuid);
  const pending = media.filter(isPendingWizardMedia);
  if (pending.length === 0) {
    return { data: draft.data, uploaded: 0, failed: [], fileIds: [] };
  }

  const sequence = await runUploadSequence(
    pending.map(toSequenceItem),
    async ({ record }) => {
      const ack = await uploadAccidentImage(session, {
        accidentId: draft.server_id,
        base64Data: await readBase64(record),
        category: record.category as MediaCategory,
        fileName: `${record.id}.jpg`,
        mimeType: record.mime_type ?? 'image/jpeg',
        sequence: 0,
      });
      return ack._id;
    },
    {
      persistFileId: async (item, fileId) => {
        await updateMediaMetadata(item.record.id, { server_file_id: fileId });
      },
      onFileStart: (item, index, total) =>
        options.onProgress?.({
          type: 'file-start',
          mediaId: item.id,
          name: item.name,
          index,
          total,
        }),
      onFileDone: item => options.onProgress?.({ type: 'file-done', mediaId: item.id, ok: true }),
      onFileFailed: (item, reason) =>
        options.onProgress?.({
          type: 'file-failed',
          mediaId: item.id,
          name: item.name,
          reason,
        }),
    },
    options.skip,
  );

  // Only the files that made it are written back, and only the ones that landed in a
  // typed card field change the payload — the rest ride `attachmentsIds`.
  const results: MediaUploadResult[] = [];
  for (const record of pending) {
    const fileId = sequence.fileIds.get(record.id);
    if (fileId) {
      results.push({
        category: record.category as MediaCategory,
        fileId,
        ownerId: String(record.metadata?.owner ?? ''),
      });
    }
  }

  return {
    data: applyServerFileIds(draft.data, results),
    uploaded: sequence.uploaded,
    failed: sequence.failed,
    fileIds: [...sequence.fileIds.values()],
  };
}