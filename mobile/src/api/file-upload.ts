import { File } from 'expo-file-system';

import type { BackendRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { ApiError } from './errors';
import { isApiSuccess, type ApiEnvelope } from './envelope';
import { assetKindFor } from '@/domain/asset-kind';
import { getConnectivitySnapshot } from '@/services/connectivity';
import { getEffectiveApiBaseUrl } from '@/services/server-url';
import type { Session } from '@/domain/types';

/**
 * General file upload for dynamic-form asset fields.
 *
 * Mirrors the web client's `UploadImage` component: the Lesan server accepts a
 * `multipart/form-data` body carrying the bytes in a `file` part and the act
 * envelope as a JSON string in a `lesan-body` part. The framework injects the
 * parsed `FormData` into `details.set.formData`, which is what
 * `file.uploadFile` reads (see `back/src/file/uploadFile/uploadFile.fn.ts`).
 *
 * This is deliberately a separate transport from the JSON `lesanApi`: the JSON
 * path is used for every ordinary act, but a file cannot ride inside JSON
 * without base64-inflating it, and `file.uploadFile` only accepts multipart.
 * The endpoint is the same `${base}/lesan`, so the "acts are not REST paths"
 * rule still holds.
 *
 * `file.uploadAccidentImages` (base64 JSON, image-only, category-bound) stays
 * the transport for the accident wizard's fixed media slots; a dynamic form's
 * `file` field can carry photos, videos and documents, so it needs this one.
 */

/**
 * The shape Expo's multipart encoder will accept for the file part.
 *
 * Expo SDK 57 replaces `fetch` with the winter runtime, whose
 * `convertFormDataAsync` reads each part as one of exactly three things: a
 * string, a real `Blob`, or an object exposing a `bytes()` method. Anything else
 * is rejected with `Unsupported FormDataPart implementation`.
 *
 * The long-standing React Native idiom — `formData.append('file', { uri, name,
 * type })` — is none of them. A plain object is not `instanceof Blob` and has no
 * `bytes()`, so the encoder throws *before any byte leaves the device*. Because
 * `fetch` throws synchronously, the error reaches the officer as the generic
 * transport failure rather than as anything about the file.
 *
 * `expo-file-system`'s `File` does carry `bytes()`, but it exposes neither `name`
 * nor `type`, and the encoder reads those two properties off the part to write
 * the `filename=` and `Content-Type` headers. A bare `File` therefore uploads
 * anonymously, and the server stores whatever it was given — an `<ObjectId>-`
 * prefix with no extension and an `application/octet-stream` type.
 *
 * So the part is a thin adapter: the two header fields plus a `bytes()` that reads
 * the local file at send time. Reading lazily rather than up front is what keeps a
 * captured video off the heap while the officer is still filling in the form.
 */
type MultipartFilePart = {
  name: string;
  type: string;
  bytes: () => Promise<Uint8Array>;
};

function filePartFor(candidate: UploadCandidate): MultipartFilePart {
  const file = new File(candidate.uri);
  if (!file.exists) {
    // Checked here rather than left to the encoder: the read happens deep inside
    // `fetch`, where a missing file is indistinguishable from a network fault.
    // The media row can outlive its bytes when the file is cleared from outside
    // the app, and retrying that one is pointless — it has to be re-picked.
    throw new ApiError('Local file is missing.', 'missing_file');
  }
  return {
    name: candidate.name,
    type: candidate.mimeType || 'application/octet-stream',
    bytes: () => file.bytes(),
  };
}

/**
 * A local file ready to upload, addressed by a `file://` URI.
 */
export type UploadCandidate = {
  uri: string;
  name: string;
  mimeType: string;
};

/** The server's acknowledgement for an uploaded file. */
export type UploadedFile = {
  _id: string;
  name?: string;
  type?: string;
  size?: number;
};

type UploadActDetails = BackendRequest['main']['file']['uploadFile'];

/**
 * What the client may put in `set`.
 *
 * The generated declaration types `createdAt`/`updatedAt` as required because
 * they are spread from `createUpdateAt`, but they are `defaulted` in the act's
 * validator and the server stamps them itself — the web client sends only
 * `type`. Omitting them here keeps the act/model names checked against the
 * declaration without asserting a field the client must not send.
 */
type UploadSet = Omit<UploadActDetails['set'], 'createdAt' | 'updatedAt'>;

/** Only the identity of the created file is needed; the rest is display sugar. */
const UPLOAD_ACK_PROJECTION = { _id: 1, name: 1, size: 1, type: 1 } as const;

/**
 * Upload one file through `file.uploadFile`.
 *
 * Large videos make the default act timeout far too short, so the timeout is
 * generous by default and overridable. The token is sent in the `token` header
 * without a `Bearer` prefix, exactly as the JSON client does.
 */
export async function uploadFile(
  session: Session,
  candidate: UploadCandidate,
  options: ApiRequestOptions = {},
): Promise<UploadedFile> {
  const apiBaseUrl = await getEffectiveApiBaseUrl();

  const connectivity = await getConnectivitySnapshot();
  if (connectivity.status === 'offline') {
    throw new ApiError('Network is offline.', 'offline');
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? 120_000);
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const kind = assetKindFor(candidate.mimeType, candidate.name);

    // The framework reads the act envelope from this part and merges the parsed
    // FormData into `details.set`. `set.type` is the only field the client owns.
    const set: UploadSet = { type: kind };
    const lesanBody = {
      service: 'main',
      model: 'file',
      act: 'uploadFile',
      details: {
        set,
        get: UPLOAD_ACK_PROJECTION,
      },
    };

    const formData = new FormData();
    // The framework reads the act envelope from this part and merges the parsed
    // FormData into `details.set`. Neither part may be appended as a bare
    // `{ uri, name, type }` — see `filePartFor` for why, and for what Expo's
    // encoder does with anything else.
    formData.append('file', filePartFor(candidate) as unknown as Blob);
    formData.append('lesan-body', JSON.stringify(lesanBody));

    let response: Response;
    try {
      response = await fetch(apiBaseUrl, {
        method: 'POST',
        // No Content-Type header: `fetch` sets it with the multipart boundary.
        headers: {
          Accept: 'application/json',
          token: session.token,
        },
        body: formData,
        signal: controller.signal,
      });
    } catch (error) {
      throw classifyTransportFailure(error, timedOut);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      // The address answered with something that is not the Lesan backend — an
      // HTML error page from the web client or a proxy is the usual cause. That
      // is a server-address mistake, not a bad file, so it gets its own code
      // instead of being filed as an unrecognizable response.
      throw new ApiError('API response was not JSON.', 'wrong_server', response.status, {
        status: response.status,
        reason: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      });
    }

    if (!payload || typeof payload !== 'object' || !('success' in payload)) {
      throw new ApiError('Invalid API response envelope.', 'invalid_response', response.status);
    }

    const envelope = payload as ApiEnvelope<UploadedFile>;
    if (!isApiSuccess(envelope)) {
      throw new ApiError(
        'API act returned an error.',
        'validation',
        response.status,
        envelope.body ?? envelope.error,
      );
    }
    if (!envelope.body?._id) {
      throw new ApiError('Upload acknowledgement had no file id.', 'invalid_response', response.status);
    }
    return envelope.body;
  } catch (error) {
    logDevelopmentFailure(error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Upload failures are invisible without this.
 *
 * The JSON client logs its failures through `client.ts`; this transport is a
 * separate `fetch` and had no equivalent, so a rejected upload reached the
 * officer as a bare "unexpected error" with nothing in the Metro terminal to
 * explain it. Status, code and the captured reason are enough to tell a wrong
 * server address from a dead network from a rejected file — and no request body,
 * token or file content is printed.
 */
let lastDevWarning: string | null = null;

function logDevelopmentFailure(error: unknown): void {
  // `__DEV__` only exists under React Native. Reading it unguarded would throw a
  // ReferenceError from inside the catch and replace the real upload error with
  // something meaningless — an error reporter must never mask what it reports.
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  const fingerprint = error instanceof Error ? `${error.name}:${error.message}` : String(error);
  if (fingerprint === lastDevWarning) {
    return;
  }
  lastDevWarning = fingerprint;
  if (error instanceof ApiError) {
    console.warn('[LESAN UPLOAD]', {
      code: error.code,
      status: error.status,
      details: error.details,
    });
    return;
  }
  console.warn('[LESAN UPLOAD] unexpected failure', error);
}

function classifyTransportFailure(error: unknown, timedOut: boolean): ApiError {
  if (error instanceof ApiError) return error;
  if (timedOut) return new ApiError('API request timed out.', 'timeout');
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  if (/cancel|abort/i.test(message)) {
    return new ApiError('API request was cancelled.', 'cancelled', undefined, message);
  }
  if (error instanceof TypeError) {
    return new ApiError('Network request failed.', 'offline', undefined, message);
  }
  return new ApiError('Unexpected API request failure.', 'unknown', undefined, error);
}
