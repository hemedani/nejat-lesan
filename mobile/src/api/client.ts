import { getAppConfig } from '@/config/env';

import type { BackendActRequest, BackendRequest } from './backend-types';
import { ApiEnvelope, isApiSuccess } from './envelope';
import { ApiError } from './errors';
import { lesanApi } from './lesan-api';
import { getConnectivitySnapshot } from '@/services/connectivity';

const DEFAULT_TIMEOUT_MS = 15_000;

export type ApiRequestOptions = {
  token?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type TypedActRequest<
  TService extends keyof BackendRequest,
  TModel extends keyof BackendRequest[TService],
  TAct extends keyof BackendRequest[TService][TModel],
> = BackendActRequest<TService, TModel, TAct>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

function classifyTransportFailure(error: unknown, timedOut: boolean): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (timedOut) {
    return new ApiError('API request timed out.', 'timeout');
  }
  const message = getErrorMessage(error);
  if (/cancel|abort/i.test(message)) {
    return new ApiError('API request was cancelled.', 'cancelled', undefined, message);
  }
  if (error instanceof SyntaxError || /json parse|unexpected end of input/i.test(message)) {
    return new ApiError('API response was incomplete.', 'invalid_response', undefined, message);
  }
  if (error instanceof TypeError) {
    return new ApiError('Network request failed.', 'offline');
  }
  return new ApiError('Unexpected API request failure.', 'unknown', undefined, error);
}

function parseResponse<T>(value: unknown): ApiEnvelope<T> {
  if (!value || typeof value !== 'object' || !('success' in value)) {
    throw new ApiError('Invalid API response envelope.', 'invalid_response');
  }
  return value as ApiEnvelope<T>;
}

let lastDevWarning: string | null = null;

function logDevelopmentFailure(error: unknown): void {
  if (!__DEV__) {
    return;
  }
  const fingerprint = error instanceof Error ? `${error.name}:${error.message}` : String(error);
  if (fingerprint === lastDevWarning) {
    return;
  }
  lastDevWarning = fingerprint;
  if (error instanceof ApiError) {
    console.warn('[LESAN API]', {
      code: error.code,
      status: error.status,
      details: error.details,
    });
    return;
  }
  console.warn('[LESAN API] unexpected failure', error);
}

export async function callAct<
  TService extends keyof BackendRequest,
  TModel extends keyof BackendRequest[TService],
  TAct extends keyof BackendRequest[TService][TModel],
  TResponse,
>(
  request: TypedActRequest<TService, TModel, TAct>,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { apiBaseUrl } = getAppConfig();
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const connectivity = await getConnectivitySnapshot();
    if (connectivity.status === 'offline') {
      throw new ApiError('Network is offline.', 'offline');
    }

    let payload: unknown;
    try {
      payload = await lesanApi({
        URL: apiBaseUrl,
        settings: { signal: controller.signal },
        baseHeaders: {
          Accept: 'application/json',
          ...(options.token ? { token: options.token } : {}),
        },
      }).send(request);
    } catch (error) {
      throw classifyTransportFailure(error, timedOut);
    }

    let envelope: ApiEnvelope<TResponse>;
    try {
      envelope = parseResponse<TResponse>(payload);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Invalid API response envelope.', 'invalid_response');
    }

    if (!isApiSuccess(envelope)) {
      throw new ApiError('API act returned an error.', 'validation', undefined, envelope.body ?? envelope.error);
    }
    return envelope.body;
  } catch (error) {
    logDevelopmentFailure(error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw classifyTransportFailure(error, timedOut);
  } finally {
    clearTimeout(timeout);
  }
}

export function callTypedAct<
  TService extends keyof BackendRequest,
  TModel extends keyof BackendRequest[TService],
  TAct extends keyof BackendRequest[TService][TModel],
  TResponse,
>(
  request: TypedActRequest<TService, TModel, TAct>,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  return callAct(request, options);
}
