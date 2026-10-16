import { uploadFile } from '@/api/file-upload';
import { ensureExtension } from '@/domain/asset-kind';
import {
  resolveAssetIdsInData,
  splitAssetAnswerRows,
  type AssetIdMap,
  type AssetNameMap,
} from '@/domain/asset-writeback';
import type { FailedUpload } from '@/domain/upload-events';
import type { AccidentDraft, Session } from '@/domain/types';
import type { MediaRecord } from '@/storage/local-database';
import { listMedia, updateMediaMetadata } from '@/storage/local-database';
import { withAttachmentIds } from '@/domain/attachment-ids';
import { runUploadSequence, type UploadSequenceItem } from '@/services/upload-sequence';

import type { UploadOptions } from './upload-options';

export type FormAssetSyncResult = {
  data: Record<string, unknown>;
  uploaded: number;
  failed: FailedUpload[];
  /**
   * The server ids the *answers* actually reference, in first-seen order.
   *
   * Taken from the answer rows rather than from everything that uploaded: a file the
   * officer captured and then removed from the field is still in the media table, and
   * linking it would put a phantom tile in the report's gallery.
   */
  fileIds: string[];
};

/**
 * Uploads the assets captured by dynamic-form `file` fields.
 *
 * The counterpart of `syncReportMedia` for the accident wizard's fixed media slots, but
 * for a different transport: form assets can be photos, videos or documents, and
 * `file.uploadAccidentImages` only accepts images. Each file goes up through
 * `file.uploadFile` (multipart), and its server `_id` is written back into the payload in
 * place of the local id.
 *
 * Two things are written back, not one. Every local id is swapped for the server's
 * (`resolveAssetIdsInData`), and each `file` field's snapshot row is split into ids and
 * filenames so the review screen can show names (`splitAssetAnswerRows`). The split also
 * reports which files the answers reference, which becomes the report's `attachmentsIds`
 * — the gallery is built from that relation, so a file that never reaches it is invisible
 * in the panel.
 *
 * Idempotent: a record already carrying `server_file_id` is skipped, so a retry after a
 * partial failure re-uploads only what is still missing.
 */
export async function syncFormAssets(
  session: Session,
  draft: AccidentDraft,
  options: UploadOptions = {},
): Promise<FormAssetSyncResult> {
  const media = await listMedia(draft.client_report_uuid);
  const assets = media.filter(record => record.category === 'asset');
  if (assets.length === 0) {
    return { data: draft.data, uploaded: 0, failed: [], fileIds: [] };
  }

  const sequence = await runUploadSequence(
    assets.map(toSequenceItem),
    async ({ record }) => {
      const ack = await uploadFile(session, {
        uri: record.local_uri,
        name: fileNameOf(record),
        mimeType: record.mime_type ?? 'application/octet-stream',
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

  const mapping: AssetIdMap = {};
  const names: AssetNameMap = {};
  for (const item of assets.map(toSequenceItem)) {
    const serverId = sequence.fileIds.get(item.id);
    if (!serverId) {
      continue;
    }
    mapping[item.id] = serverId;
    names[serverId] = fileNameOf(item.record);
  }

  const split = splitAssetAnswerRows(draft.data['dynamic_answers'], mapping, names);

  let data = draft.data;
  if (split.rows !== draft.data['dynamic_answers']) {
    data = { ...data, dynamic_answers: split.rows };
  }
  if (split.attachmentIds.length > 0) {
    // Server ids already, so the id walk below leaves them alone.
    data = withAttachmentIds(data, split.attachmentIds);
  }

  return {
    data: resolveAssetIdsInData(data, mapping),
    uploaded: sequence.uploaded,
    failed: sequence.failed,
    fileIds: split.attachmentIds,
  };
}

function serverFileId(record: MediaRecord): string | undefined {
  const value = (record.metadata as Record<string, unknown> | undefined)?.['server_file_id'];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * A media row as the sweep sees it.
 *
 * An asset keeps the name the officer's file already had, so the officer recognises it
 * in the list rather than being shown an opaque record id.
 */
type AssetSequenceItem = UploadSequenceItem & { record: MediaRecord };

function toSequenceItem(record: MediaRecord): AssetSequenceItem {
  return {
    id: record.id,
    name: fileNameOf(record),
    record,
    serverFileId: serverFileId(record),
  };
}

/**
 * The name the server should store.
 *
 * `asset-service` already guarantees an extension at capture time; this re-checks it
 * because a record captured by an earlier build has a bare name, and the server writes
 * exactly what it is given — an extensionless upload cannot be rendered by the front
 * panel.
 */
export function fileNameOf(record: MediaRecord): string {
  const stored = (record.metadata as Record<string, unknown> | undefined)?.['file_name'];
  const base = typeof stored === 'string' && stored.length > 0 ? stored : record.id;
  return ensureExtension(base, record.mime_type);
}