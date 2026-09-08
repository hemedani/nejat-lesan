import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { MediaRecord } from '@/storage/local-database';
import {
  deleteMedia,
  listMedia,
  saveMedia,
  updateMediaUri,
} from '@/storage/local-database';

export type MediaCategory = 'plate' | 'insurance' | 'croquis' | 'damage' | 'incident';

export type MediaOwner = string;

const MAX_WIDTH_PX = 1600;
const JPEG_QUALITY = 0.7;

export type AttachOptions = {
  clientReportUuid: string;
  category: MediaCategory;
  owner: MediaOwner;
  source: 'camera' | 'library';
  replaceId?: string;
};

export type AttachResult =
  | { ok: true; record: MediaRecord }
  | { ok: false; reason: 'permission_denied' | 'cancelled' | 'failed' };

async function ensureMediaDirectory(clientReportUuid: string): Promise<Directory> {
  const dir = new Directory(Paths.document, 'media', clientReportUuid);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

async function pickImage(source: 'camera' | 'library'): Promise<{
  uri: string;
  width: number;
} | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) {
      return null;
    }
    return { uri: asset.uri, width: asset.width ?? 0 };
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    selectionLimit: 1,
  });
  const asset = result.assets?.[0];
  if (result.canceled || !asset) {
    return null;
  }
  return { uri: asset.uri, width: asset.width ?? 0 };
}

async function compressToJpeg(uri: string, width: number): Promise<string> {
  if (width > 0 && width <= MAX_WIDTH_PX) {
    return uri;
  }
  const builder = ImageManipulator.ImageManipulator.manipulate(uri);
  builder.resize({ width: MAX_WIDTH_PX });
  const rendered = await builder.renderAsync();
  const saved = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return saved.uri;
}

function buildId(): string {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function attachImage(options: AttachOptions): Promise<AttachResult> {
  try {
    const picked = await pickImage(options.source);
    if (!picked) {
      const permissionResponse =
        options.source === 'camera'
          ? await ImagePicker.getCameraPermissionsAsync()
          : await ImagePicker.getMediaLibraryPermissionsAsync();
      return {
        ok: false,
        reason:
          permissionResponse.granted || permissionResponse.status === 'undetermined'
            ? 'cancelled'
            : 'permission_denied',
      };
    }

    const compressedUri = await compressToJpeg(picked.uri, picked.width);
    const dir = await ensureMediaDirectory(options.clientReportUuid);
    const id = options.replaceId ?? buildId();
    const destination = new File(dir, `${id}.jpg`);

    if (destination.exists) {
      destination.delete();
    }

    const sourceFile = new File(compressedUri);
    sourceFile.copy(destination);

    let sizeBytes: number | undefined;
    try {
      sizeBytes = destination.size != null ? Number(destination.size) : undefined;
    } catch {
      sizeBytes = undefined;
    }

    if (options.replaceId) {
      const existing = (await listMedia(options.clientReportUuid)).find(
        record => record.id === options.replaceId,
      );
      if (existing && existing.local_uri !== destination.uri) {
        const previous = new File(existing.local_uri);
        if (previous.exists) {
          previous.delete();
        }
      }
      await updateMediaUri(options.replaceId, destination.uri, sizeBytes);
      const updated = (await listMedia(options.clientReportUuid)).find(
        record => record.id === options.replaceId,
      );
      return updated ? { ok: true, record: updated } : { ok: false, reason: 'failed' };
    }

    const now = new Date().toISOString();
    const record: MediaRecord = {
      category: options.category,
      client_report_uuid: options.clientReportUuid,
      created_at: now,
      id,
      local_uri: destination.uri,
      metadata: { owner: options.owner },
      mime_type: 'image/jpeg',
      size_bytes: sizeBytes,
    };
    await saveMedia(record);
    return { ok: true, record };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

export async function removeMedia(record: MediaRecord): Promise<void> {
  try {
    const file = new File(record.local_uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    return;
  }
  await deleteMedia(record.id);
}

export async function listMediaFor(
  clientReportUuid: string,
  category?: MediaCategory,
  owner?: MediaOwner,
): Promise<MediaRecord[]> {
  const all = await listMedia(clientReportUuid);
  return all.filter(
    record =>
      (!category || record.category === category) &&
      (!owner || (record.metadata as { owner?: string }).owner === owner),
  );
}
