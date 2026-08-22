import type { BackendActRequest, BackendRequest } from './backend-types';

export type LesanApi = {
  send: <
    TService extends keyof BackendRequest,
    TModel extends keyof BackendRequest[TService],
    TAct extends keyof BackendRequest[TService][TModel],
  >(
    body: BackendActRequest<TService, TModel, TAct>,
    additionalHeaders?: Record<string, string>,
  ) => Promise<unknown>;
  setHeaders: (headers: Record<string, string>) => void;
};

export function lesanApi({
  URL,
  settings,
  baseHeaders,
}: {
  URL: string;
  settings?: RequestInit;
  baseHeaders?: Record<string, string>;
}): LesanApi {
  const requestSettings: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...baseHeaders,
    },
    ...settings,
  };

  return {
    setHeaders(headers) {
      requestSettings.headers = {
        ...(requestSettings.headers as Record<string, string>),
        ...headers,
      };
    },
    async send(body, additionalHeaders) {
      const response = await fetch(URL, {
        ...requestSettings,
        headers: {
          ...(requestSettings.headers as Record<string, string>),
          ...additionalHeaders,
          connection: 'keep-alive',
        },
        body: JSON.stringify(body),
      });
      return response.json();
    },
  };
}
