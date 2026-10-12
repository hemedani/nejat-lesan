/**
 * Classifying a picked file for the upload contract.
 *
 * The backend's `file.uploadFile` takes a `type` discriminator that selects the
 * destination directory. Only the three shapes a form asset can take matter
 * here; the `geo`/`json`/`rar` types belong to the seed-data importer and are
 * never produced from an officer's attachment.
 *
 * Kept in the domain layer — no native or network imports — so the rule is
 * unit-testable in the plain Node test environment.
 */

/** The `type` discriminator `file.uploadFile` accepts. */
export type BackendFileType = 'image' | 'video' | 'doc' | 'geo' | 'json' | 'rar';

/** The three kinds a form asset can be, mapped onto the backend discriminator. */
export type AssetKind = 'image' | 'video' | 'doc';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', '3gp', 'avi', 'mkv', 'webm'];

/**
 * Classify a picked file.
 *
 * The mime type is authoritative when present; the extension is the fallback
 * because some providers hand back an empty or generic mime type, and a photo
 * picked without one would otherwise be filed as a document.
 */
export function assetKindFor(mimeType: string | null | undefined, name: string): AssetKind {
  const mime = (mimeType ?? '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';

  const extension = name.toLowerCase().split('.').pop() ?? '';
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image';
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
  return 'doc';
}

/**
 * The extension a mime type should be stored under.
 *
 * Spelled out rather than derived from the subtype: `image/jpeg` must become
 * `.jpg`, `video/quicktime` must become `.mov`, and `application/msword` must
 * become `.doc` — a mechanical subtype rule would produce `.jpeg`, `.quicktime`
 * and `.msword`, none of which a browser recognises.
 */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/3gpp': '3gp',
  'video/x-matroska': 'mkv',
  'video/webm': 'webm',
  'video/x-msvideo': 'avi',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
};

/**
 * A name's trailing extension, or `undefined` when it has none.
 *
 * A name with no dot at all — `photo-1791356757978`, the fallback a camera
 * capture gets — must yield `undefined` rather than the whole string.
 */
function extensionOf(name: string): string | undefined {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return undefined;
  const extension = name.slice(dot + 1).toLowerCase();
  return /^[a-z0-9]{1,8}$/.test(extension) ? extension : undefined;
}

/** The extension to store a file under, given its mime type. */
export function extensionForMime(mimeType: string | null | undefined): string {
  const [rawMime = ''] = (mimeType ?? '').toLowerCase().split(';');
  const mime = rawMime.trim();
  const known = EXTENSION_BY_MIME[mime];
  if (known) return known;
  // An unlisted but simple subtype still beats `.bin`. Anything with a dash or a
  // dot (`octet-stream`, `vnd.openxmlformats-…`) is not an extension and falls
  // through.
  const subtype = mime.split('/')[1] ?? '';
  return /^[a-z0-9]{1,8}$/.test(subtype) ? subtype : 'bin';
}

/**
 * Guarantee a picked file's name carries an extension.
 *
 * This is what makes an uploaded asset *displayable*. A camera capture on
 * Android reports no `fileName`, so the name falls back to `photo-1791356757978`
 * — and the server writes exactly that to disk. Served back from `/uploads/…`
 * with no extension in the path, the browser has no MIME hint and the front
 * panel's `<img>` cannot render it, even though the bytes are a valid JPEG.
 *
 * A name that already has an extension is returned untouched: it came from the
 * user or the provider, and second-guessing it would be worse than trusting it.
 */
export function ensureExtension(name: string, mimeType: string | null | undefined): string {
  const trimmed = name.trim();
  if (extensionOf(trimmed)) return trimmed;
  return `${trimmed}.${extensionForMime(mimeType)}`;
}

/**
 * Force a name's extension to match its mime type, keeping the base name.
 *
 * For a file whose bytes were **re-encoded**: an image is always stored as JPEG,
 * so a picked `IMG_1234.HEIC` holds JPEG bytes under a HEIC name unless the
 * extension is rewritten. The base name is preserved because it is what the
 * officer recognises in the front panel — only the extension lies.
 */
export function replaceExtension(name: string, mimeType: string | null | undefined): string {
  const trimmed = name.trim();
  const dot = trimmed.lastIndexOf('.');
  const base = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  return `${base}.${extensionForMime(mimeType)}`;
}
