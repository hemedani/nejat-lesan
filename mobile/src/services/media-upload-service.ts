import { File } from 'expo-file-system';

import { uploadAccidentImage } from '@/api/media';
import { applyServerFileIds, type MediaUploadResult } from '@/domain/media-writeback';
import type { AccidentDraft, Session } from '@/domain/types';
import type { MediaRecord } from '@/storage/local-database';
import { listMedia, updateMediaMetadata } from '@/storage/local-database';

export type ReportMediaSyncResult = {
  data: Record<string, unknown>;
  uploaded: number;
};

function serverFileId(record: MediaRecord): string | undefined {
  const value = (record.metadata as Record<string, unknown> | undefined)?.['server_file_id'];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function readBase64(record: MediaRecord): Promise<string> {
  const file = new File(record.local_uri);
  const base64 = await file.base64();
  // Some platform paths may surface a data-URL prefix; the wire format needs raw base64.
  return base64.replace(/^data:[^;]+;base64,/, '');
}

/**
 * Uploads every not-yet-uploaded media record of a report and writes the
 * returned server file `_id`s back into the draft payload. Idempotent:
 * records already carrying `server_file_id` are skipped.
 * Callers gate this behind the upload contract flag.
 */
export async function syncReportMedia(
  session: Session,
  draft: AccidentDraft,
): Promise<ReportMediaSyncResult> {
  const media = await listMedia(draft.client_report_uuid);
  const pending = media.filter(record => !serverFileId(record));
  if (pending.length === 0) {
    return { data: draft.data, uploaded: 0 };
  }

  const results: MediaUploadResult[] = [];
  for (const record of pending) {
    const existingId = serverFileId(record);
    const fileId =
      existingId ??
      (
        await uploadAccidentImage(session, {
          accidentId: draft.server_id,
          base64Data: await readBase64(record),
          category: record.category,
          fileName: `${record.id}.jpg`,
          mimeType: record.mime_type ?? 'image/jpeg',
          sequence: 0,
        })
      )._id;
    if (!existingId) {
      await updateMediaMetadata(record.id, { server_file_id: fileId });
    }
    results.push({ category: record.category, fileId, ownerId: String(record.metadata?.owner ?? '') });
  }

  return {
    data: applyServerFileIds(draft.data, results),
    uploaded: results.length,
  };
}
