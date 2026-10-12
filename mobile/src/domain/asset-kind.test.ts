import { describe, expect, it } from 'vitest';

import { assetKindFor, ensureExtension, extensionForMime, replaceExtension } from './asset-kind';

describe('assetKindFor', () => {
  it('classifies by mime type when the provider supplies one', () => {
    expect(assetKindFor('image/jpeg', 'photo.jpg')).toBe('image');
    expect(assetKindFor('video/mp4', 'clip.mp4')).toBe('video');
    expect(assetKindFor('application/pdf', 'report.pdf')).toBe('doc');
  });

  it('is case-insensitive about the mime type', () => {
    expect(assetKindFor('IMAGE/PNG', 'scan')).toBe('image');
    expect(assetKindFor('Video/QuickTime', 'clip')).toBe('video');
  });

  it('falls back to the extension when the mime type is missing', () => {
    expect(assetKindFor(null, 'IMG_1234.HEIC')).toBe('image');
    expect(assetKindFor(undefined, 'recording.MOV')).toBe('video');
    expect(assetKindFor('', 'contract.docx')).toBe('doc');
  });

  it('treats a generic or unknown type as a document', () => {
    // Android providers often report `application/octet-stream` for anything
    // they cannot identify; the backend stores it under `docs`, which is right.
    expect(assetKindFor('application/octet-stream', 'attachment')).toBe('doc');
    expect(assetKindFor('application/octet-stream', 'archive.zip')).toBe('doc');
  });

  it('prefers the mime type over a misleading extension', () => {
    expect(assetKindFor('image/jpeg', 'weird.pdf')).toBe('image');
    expect(assetKindFor('video/mp4', 'renamed.jpg')).toBe('video');
  });
});

describe('extensionForMime', () => {
  it('maps the mime types an officer actually picks', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('video/quicktime')).toBe('mov');
    expect(extensionForMime('application/pdf')).toBe('pdf');
    expect(extensionForMime('application/msword')).toBe('doc');
  });

  it('ignores mime parameters and casing', () => {
    expect(extensionForMime('IMAGE/JPEG; charset=binary')).toBe('jpg');
  });

  it('falls back to the subtype, then to bin', () => {
    // A simple unlisted subtype is still a usable extension.
    expect(extensionForMime('image/avif')).toBe('avif');
    // A dashed or dotted subtype is not an extension at all.
    expect(extensionForMime('application/octet-stream')).toBe('bin');
    expect(extensionForMime(undefined)).toBe('bin');
    expect(extensionForMime('')).toBe('bin');
  });
});

describe('ensureExtension', () => {
  it('appends the extension a camera capture never had', () => {
    // The real case: Android reports no `fileName` for a camera shot, so the
    // name has no extension and the server would store it unrenderable.
    expect(ensureExtension('photo-1791356757978', 'image/jpeg')).toBe('photo-1791356757978.jpg');
    expect(ensureExtension('video-1791356757978', 'video/mp4')).toBe('video-1791356757978.mp4');
  });

  it('leaves a name that already has an extension alone', () => {
    expect(ensureExtension('IMG_1234.HEIC', 'image/jpeg')).toBe('IMG_1234.HEIC');
    expect(ensureExtension('contract.docx', 'application/octet-stream')).toBe('contract.docx');
  });

  it('treats a leading or trailing dot as no extension', () => {
    expect(ensureExtension('.hidden', 'image/png')).toBe('.hidden.png');
    expect(ensureExtension('trailing.', 'image/png')).toBe('trailing..png');
  });

  it('treats any dotted tail as an extension rather than second-guessing it', () => {
    // The deliberate rule: `extensionOf` accepts any short alphanumeric tail, so
    // a name that already ends in a dot-segment is left untouched. The realistic
    // camera fallbacks (`photo-1791356757978`) have no dot at all and do get one.
    expect(ensureExtension('IMG_2024.10.01', 'image/jpeg')).toBe('IMG_2024.10.01');
    expect(ensureExtension('photo-1791356757978', 'image/jpeg')).toBe('photo-1791356757978.jpg');
  });

  it('trims surrounding whitespace', () => {
    expect(ensureExtension('  photo  ', 'image/jpeg')).toBe('photo.jpg');
  });
});

describe('replaceExtension', () => {
  it('rewrites a re-encoded image’s extension to match its bytes', () => {
    // An image is always stored as JPEG, so a HEIC pick must not keep its name.
    expect(replaceExtension('IMG_1234.HEIC', 'image/jpeg')).toBe('IMG_1234.jpg');
    expect(replaceExtension('photo.webp', 'image/jpeg')).toBe('photo.jpg');
  });

  it('adds the extension when there is none', () => {
    expect(replaceExtension('photo-1791356757978', 'image/jpeg')).toBe('photo-1791356757978.jpg');
  });

  it('keeps a leading dot as part of the base name', () => {
    expect(replaceExtension('.hidden', 'image/jpeg')).toBe('.hidden.jpg');
  });
});
