import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { assetKindFor, ensureExtension, replaceExtension, type AssetKind } from '@/domain/asset-kind';
import { compressImageToJpeg, listMediaFor } from '@/services/media-service';
import {
  deleteMedia,
  saveMedia,
  type MediaRecord,
} from '@/storage/local-database';

/**
 * Local capture of a dynamic form's `file` field assets.
 *
 * A form's `file` field can hold a photo, a video or a document, so unlike the
 * accident wizard's fixed media slots (`media-service`) it cannot assume an
 * image. The captured bytes are copied into the report's media directory and
 * recorded in the `media` table under the `asset` category, keyed by the field's
 * instance path so two `file` fields — or the same field in two repeatable rows
 * — never share a slot.
 *
 * Nothing is uploaded here. The record survives app restart and is uploaded by
 * the sync worker, so an officer who is offline can still attach evidence and
 * file the report later.
 */

export type AssetSource = 'camera' | 'library' | 'document';

/** The owner key of a `file` field: its instance path inside the answer tree. */
export type AssetOwner = string;

export type AttachAssetOptions = {
  clientReportUuid: string;
  owner: AssetOwner;
  source: AssetSource;
};

export type AttachAssetResult =
  | { ok: true; record: MediaRecord }
  | { ok: false; reason: 'permission_denied' | 'cancelled' | 'failed' };

/** A file chosen by a picker, before it is copied into app storage. */
type PickedAsset = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  /** Present for images/videos; needed to decide whether a resize is worthwhile. */
  width?: number;
  kind: AssetKind;
};

function buildId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Strip path separators so a provider-supplied name cannot escape the directory. */
function safeName(name: string): string {
  const cleaned = name.replace(/[/\\]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : 'file';
}

async function ensureMediaDirectory(clientReportUuid: string): Promise<Directory> {
  const dir = new Directory(Paths.document, 'media', clientReportUuid);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

/**
 * Pick from the device camera.
 *
 * `mediaTypes` includes videos so the officer can record a clip; the picker
 * falls back to a still photo on devices that cannot capture video.
 */
async function pickFromCamera(): Promise<PickedAsset | 'permission_denied' | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return 'permission_denied';

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.9,
    allowsEditing: false,
  });
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;

  const name = asset.fileName ?? `${asset.type === 'video' ? 'video' : 'photo'}-${Date.now()}`;
  return {
    uri: asset.uri,
    name,
    mimeType: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    size: asset.fileSize,
    width: asset.width,
    kind: assetKindFor(asset.mimeType, name),
  };
}

/** Pick an image or video from the gallery. */
async function pickFromLibrary(): Promise<PickedAsset | 'permission_denied' | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return 'permission_denied';

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.9,
    selectionLimit: 1,
  });
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;

  const name = asset.fileName ?? `${asset.type === 'video' ? 'video' : 'photo'}-${Date.now()}`;
  return {
    uri: asset.uri,
    name,
    mimeType: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    size: asset.fileSize,
    width: asset.width,
    kind: assetKindFor(asset.mimeType, name),
  };
}

/**
 * Pick any document.
 *
 * `copyToCacheDirectory` is required: without it the provider URI (a
 * `content://` handle on Android) cannot be read by `expo-file-system`, so the
 * copy into the media directory would fail.
 */
async function pickDocument(): Promise<PickedAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: '*/*',
  });
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;

  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size,
    kind: assetKindFor(asset.mimeType, asset.name),
  };
}

async function pick(source: AssetSource): Promise<PickedAsset | 'permission_denied' | null> {
  if (source === 'camera') return pickFromCamera();
  if (source === 'library') return pickFromLibrary();
  return pickDocument();
}

/** Size in bytes of a copied file, tolerating platforms that report nothing. */
function sizeOf(file: File): number | undefined {
  try {
    return file.size != null ? Number(file.size) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Pick one asset and persist it against a form field.
 *
 * Images are downscaled to JPEG so a phone photo does not blow the upload
 * budget; videos and documents are copied byte-for-byte and keep their original
 * name and type, because re-encoding them would corrupt or defeat the point.
 */
export async function attachAsset(options: AttachAssetOptions): Promise<AttachAssetResult> {
  let picked: PickedAsset | 'permission_denied' | null;
  try {
    picked = await pick(options.source);
  } catch {
    return { ok: false, reason: 'failed' };
  }

  if (picked === 'permission_denied') return { ok: false, reason: 'permission_denied' };
  if (!picked) return { ok: false, reason: 'cancelled' };

  try {
    const dir = await ensureMediaDirectory(options.clientReportUuid);
    const id = buildId();
    const baseName = safeName(picked.name);

    let destination: File;
    let mimeType = picked.mimeType;
    // The stored name must describe the stored bytes, because it is the name the
    // server writes to disk and the one the front panel shows and links to.
    let fileName: string;
    if (picked.kind === 'image') {
      const compressedUri = await compressImageToJpeg(picked.uri, picked.width ?? 0);
      destination = new File(dir, `${id}.jpg`);
      if (destination.exists) destination.delete();
      new File(compressedUri).copy(destination);
      mimeType = 'image/jpeg';
      // Re-encoded to JPEG, so a picked `.heic`/`.webp` name would be a lie.
      fileName = replaceExtension(baseName, mimeType);
    } else {
      destination = new File(dir, `${id}-${baseName}`);
      if (destination.exists) destination.delete();
      new File(picked.uri).copy(destination);
      // Copied byte-for-byte: keep the provider's extension, but a camera video
      // reports no name at all, and an extensionless upload cannot be rendered.
      fileName = ensureExtension(baseName, mimeType);
    }

    const record: MediaRecord = {
      id,
      category: 'asset',
      client_report_uuid: options.clientReportUuid,
      created_at: new Date().toISOString(),
      local_uri: destination.uri,
      mime_type: mimeType,
      size_bytes: sizeOf(destination) ?? picked.size,
      metadata: { owner: options.owner, kind: picked.kind, file_name: fileName },
    };
    await saveMedia(record);
    return { ok: true, record };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/** Assets captured for one field of one report, in capture order. */
export function listAssetsFor(
  clientReportUuid: string,
  owner: AssetOwner,
): Promise<MediaRecord[]> {
  return listMediaFor(clientReportUuid, 'asset', owner);
}

/** Delete an asset's bytes and its row. */
export async function removeAsset(record: MediaRecord): Promise<void> {
  try {
    const file = new File(record.local_uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // A missing file is the same end state as a successful delete; the row still
    // has to go, otherwise the field would keep showing a broken thumbnail.
  }
  await deleteMedia(record.id);
}
