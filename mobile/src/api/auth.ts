import type { MobileLoginRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';

export type MobileLoginResponse = {
  token: string;
  permissions?: string[];
  user: unknown;
  devices?: unknown[];
};

export function mobileLogin(
  details: MobileLoginRequest['details'],
  options: ApiRequestOptions = {},
): Promise<MobileLoginResponse> {
  return callTypedAct(
    {
      service: 'main',
      model: 'user',
      act: 'mobileLogin',
      details,
    },
    options,
  );
}