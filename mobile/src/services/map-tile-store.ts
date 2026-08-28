import { Directory, File, Paths } from 'expo-file-system';

import { getAppConfig } from '@/config/env';
import type { TileCoord } from '@/domain/map-packs';

/**
 * Offline tiles mirror the XYZ slippy-map layout exactly:
 * `Documents/mapcache/{z}/{x}/{y}.png`. The WebView loads them through
 * `file://` URIs with no index needed — presence of the file IS the cache.
 */
export function mapCacheRoot(): Directory {
  return new Directory(Paths.document, 'mapcache');
}

export function tileRemoteUrl(tile: TileCoord): string {
  return `${getAppConfig().mapTileUrl}/${tile.z}/${tile.x}/${tile.y}.png`;
}

export function tileLocalUri(tile: TileCoord): string {
  return `${mapCacheRoot().uri}/${tile.z}/${tile.x}/${tile.y}.png`;
}

export async function hasLocalTile(tile: TileCoord): Promise<boolean> {
  try {
    return new File(tileLocalUri(tile)).exists;
  } catch {
    return false;
  }
}

function ensureParentDirectory(tile: TileCoord): Directory {
  const zDir = new Directory(mapCacheRoot(), String(tile.z));
  const xDir = new Directory(zDir, String(tile.x));
  if (!xDir.exists) {
    xDir.create({ intermediates: true, idempotent: true });
  }
  return xDir;
}

export type TileDownloadResult =
  | { outcome: 'ok'; bytes: number }
  | { outcome: 'empty' }
  | { outcome: 'failed'; permanent: boolean; message?: string };

/**
 * Downloads one tile into the mirror. Uses a temp name + move so a failed
 * transfer can never leave a truncated tile that would later count as cached.
 * HTTP 404 is reported as `empty` (sea / Caspian tiles) — not an error.
 */
export async function downloadTile(tile: TileCoord): Promise<TileDownloadResult> {
  const parent = ensureParentDirectory(tile);
  const final = new File(parent, `${tile.y}.png`);
  if (final.exists) {
    final.delete();
  }
  const temp = new File(parent, `${tile.y}.png.part`);

  try {
    await File.downloadFileAsync(tileRemoteUrl(tile), temp);
    if (!temp.exists) {
      return { outcome: 'empty' };
    }
    const bytes = Number(temp.size ?? 0);
    await temp.move(final);
    return { outcome: 'ok', bytes };
  } catch (error) {
    try {
      if (temp.exists) {
        temp.delete();
      }
    } catch {
      // ignore temp cleanup failures
    }
    const message = error instanceof Error ? error.message : String(error);
    // The SDK surfaces missing tiles as "HTTP status 404" style failures.
    if (/\b404\b/.test(message)) {
      return { outcome: 'empty' };
    }
    if (/\b429\b/.test(message)) {
      return { outcome: 'failed', permanent: false, message };
    }
    return { outcome: 'failed', permanent: false, message };
  }
}

/** Deletes the whole tile mirror (used by pack removal). */
export async function deleteAllTiles(): Promise<void> {
  const root = mapCacheRoot();
  try {
    if (root.exists) {
      root.delete();
    }
  } catch {
    // best effort
  }
}

/** Recomputes stored bytes/tiles from the filesystem (slow; used sparingly). */
export async function measureTileMirror(): Promise<{ files: number; bytes: number }> {
  let files = 0;
  let bytes = 0;
  const root = mapCacheRoot();
  if (!root.exists) {
    return { files, bytes };
  }
  for (const zDir of root.list()) {
    if (!(zDir instanceof Directory)) {
      continue;
    }
    for (const xDir of zDir.list()) {
      if (!(xDir instanceof Directory)) {
        continue;
      }
      for (const entry of xDir.list()) {
        if (entry instanceof File && !entry.name.endsWith('.part')) {
          files += 1;
          bytes += Number(entry.size ?? 0);
        }
      }
    }
  }
  return { files, bytes };
}
