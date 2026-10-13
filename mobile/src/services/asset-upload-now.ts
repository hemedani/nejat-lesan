import { uploadFile } from '@/api/file-upload';
import { translateApiError } from '@/api/errors';
import {
  beginUploadPatch,
  failUploadPatch,
  serverFileIdOf,
  succeedUploadPatch,
} from '@/domain/asset-upload-state';
import type { Session } from '@/domain/types';
import { fileNameOf } from '@/services/asset-upload-service';
import type { MediaRecord } from '@/storage/local-database';
import { updateMediaMetadata } from '@/storage/local-database';

/**
 * Upload one captured asset at the moment the officer asks for it.
 *
 * The sync worker already uploads every asset it finds, so this is not a second
 * pipeline — it is the same `file.uploadFile` call, made early and made
 * separately per file so the field can answer immediately instead of leaving the
 * officer to find out in the drafts list.
 *
 * Failure is never fatal. A patrol officer on a dead link must still be able to
 * attach evidence, fill the form and file the report; the bytes stay in the media
 * directory, the row keeps its Persian reason, and the sync worker's next pass
 * uploads whatever is still missing (`syncFormAssets` skips any row that already
 * carries a `server_file_id`, which is what makes this safe to repeat).
 */

export type UploadAssetResult =
  | { ok: true; serverFileId: string; message: string }
  | { ok: false; message: string };

/**
 * A message the officer can act on, distinct from the flat error text.
 *
 * Offline is the common case in the field and deserves its own words: the upload
 * is queued, not lost. Anything else keeps the translated reason, so a wrong
 * server address or a rejected file says why instead of "unexpected error".
 */
function messageFor(error: unknown): string {
  const translated = translateApiError(error);
  if (translated.includes('همگام') || translated.includes('اتصال')) {
    return 'ارتباط برقرار نیست؛ فایل ذخیره شد و بعداً ارسال می‌شود.';
  }
  return translated;
}

export async function uploadAssetNow(
  session: Session,
  record: MediaRecord,
): Promise<UploadAssetResult> {
  const existing = serverFileIdOf(record);
  if (existing !== undefined) {
    return { ok: true, serverFileId: existing, message: 'این فایل قبلاً ارسال شده است.' };
  }

  await updateMediaMetadata(record.id, beginUploadPatch());

  try {
    const ack = await uploadFile(session, {
      uri: record.local_uri,
      name: fileNameOf(record),
      mimeType: record.mime_type ?? 'application/octet-stream',
    });
    await updateMediaMetadata(record.id, succeedUploadPatch(ack._id));
    return { ok: true, serverFileId: ack._id, message: 'فایل با موفقیت ارسال شد.' };
  } catch (error) {
    const message = messageFor(error);
    await updateMediaMetadata(record.id, failUploadPatch(message));
    return { ok: false, message };
  }
}
