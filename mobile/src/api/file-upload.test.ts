import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `expo-file-system` is native, so the `File` the part is built from is stubbed.
 * Only the two members `filePartFor` touches matter: `exists` decides whether the
 * upload is refused, and `bytes()` is what Expo's encoder calls.
 */
const existingUris = new Set<string>(['file:///media/ok.jpg']);

vi.mock('expo-file-system', () => ({
  File: class {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists(): boolean {
      return existingUris.has(this.uri);
    }
    async bytes(): Promise<Uint8Array> {
      return new Uint8Array([1, 2, 3]);
    }
  },
}));

// The real clients reach SQLite and the network for the endpoint; both are
// irrelevant to the part shape, which is what these tests are about.
vi.mock('@/services/connectivity', () => ({
  getConnectivitySnapshot: vi.fn(async () => ({ status: 'online' })),
}));
vi.mock('@/services/server-url', () => ({
  getEffectiveApiBaseUrl: vi.fn(async () => 'http://host/lesan'),
}));

const { uploadFile } = await import('./file-upload');

const CANDIDATE = { uri: 'file:///media/ok.jpg', name: 'asset-1-abc.jpg', mimeType: 'image/jpeg' };
const session = { token: 'test-token' } as never;

/** A `FormData` stand-in that records what was appended. */
class RecordingFormData {
  static parts: Record<string, unknown> = {};
  append(name: string, value: unknown): void {
    RecordingFormData.parts[name] = value;
  }
}

function stubFetch(payload: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => payload }));
  vi.stubGlobal('FormData', RecordingFormData);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function filePart(): Record<string, unknown> {
  return RecordingFormData.parts['file'] as Record<string, unknown>;
}

describe('the multipart file part', () => {
  beforeEach(() => {
    RecordingFormData.parts = {};
    existingUris.clear();
    existingUris.add('file:///media/ok.jpg');
    vi.unstubAllGlobals();
  });

  /**
   * Expo SDK 57's `convertFormDataAsync` dispatches each part through exactly
   * three branches and throws `Unsupported FormDataPart implementation` for
   * anything else. This mirrors that dispatch; if Expo changes it, these are the
   * assertions to re-check. The bug this pins: the old
   * `append('file', { uri, name, type })` shape falls through all three.
   */
  it('satisfies every branch Expo’s multipart encoder dispatches on', async () => {
    stubFetch({ success: true, body: { _id: '6acd' } });
    await uploadFile(session, CANDIDATE);

    const part = filePart();
    expect(typeof part).not.toBe('string');
    expect(part instanceof Blob).toBe(false);
    expect('bytes' in part).toBe(true);
    expect(typeof part.bytes).toBe('function');
  });

  it('carries the filename and content type the encoder writes into the headers', async () => {
    stubFetch({ success: true, body: { _id: '6acd' } });
    await uploadFile(session, CANDIDATE);

    // Without these the server writes `<ObjectId>-` with no extension and stores
    // `application/octet-stream`, and the console cannot render the attachment.
    expect(filePart().name).toBe(CANDIDATE.name);
    expect(filePart().type).toBe(CANDIDATE.mimeType);
  });

  it('resolves the bytes lazily, so a large capture is not held in memory', async () => {
    stubFetch({ success: true, body: { _id: '6acd' } });
    await uploadFile(session, CANDIDATE);

    const bytes = await (filePart().bytes as () => Promise<Uint8Array>)();
    expect(bytes).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('sends the act envelope as the sibling text part the server reads', async () => {
    stubFetch({ success: true, body: { _id: '6acd' } });
    await uploadFile(session, CANDIDATE);

    const envelope = JSON.parse(RecordingFormData.parts['lesan-body'] as string);
    expect(envelope).toMatchObject({
      service: 'main',
      model: 'file',
      act: 'uploadFile',
      details: { set: { type: 'image' } },
    });
  });

  it('refuses a file that is no longer on disk, and never reaches the network', async () => {
    const fetchMock = stubFetch({ success: true, body: { _id: '6acd' } });

    await expect(
      uploadFile(session, { ...CANDIDATE, uri: 'file:///media/gone.jpg' }),
    ).rejects.toMatchObject({ code: 'missing_file' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
