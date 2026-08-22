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

function isOfflineError(error: unknown): boolean {
  return error instanceof TypeError;
}

function parseResponse<T>(value: unknown): ApiEnvelope<T> {
  if (!value || typeof value !== 'object' || !('success' in value)) {
    throw new ApiError('Invalid API response envelope.', 'invalid_response');
  }
  return value as ApiEnvelope<T>;
}

function logDevelopmentFailure(error: unknown): void {
  if (!__DEV__) {
    return;
  }
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
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const connectivity = await getConnectivitySnapshot();
    if (connectivity.status === 'offline') {
      throw new ApiError('Network is offline.', 'offline');
    }

    const payload = await lesanApi({
      URL: apiBaseUrl,
      settings: { signal: controller.signal },
      baseHeaders: {
        Accept: 'application/json',
        ...(options.token ? { token: options.token } : {}),
      },
    }).send(request);

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
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('API request timed out.', 'timeout');
    }
    if (isOfflineError(error)) {
      throw new ApiError('Network request failed.', 'offline');
    }
    throw new ApiError('Unexpected API request failure.', 'unknown', undefined, error);
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