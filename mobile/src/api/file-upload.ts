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
    // React Native's FormData accepts a `{ uri, name, type }` descriptor and
    // streams the bytes from disk; the DOM `Blob` type does not describe it, so
    // the cast is the documented RN idiom.
    formData.append('file', {
      uri: candidate.uri,
      name: candidate.name,
      type: candidate.mimeType || 'application/octet-stream',
    } as unknown as Blob);
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
      throw new ApiError('API response was incomplete.', 'invalid_response', response.status, error);
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
  } finally {
    clearTimeout(timeout);
  }
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
