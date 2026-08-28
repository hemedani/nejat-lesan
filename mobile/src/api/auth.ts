import type { LoginRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { PatrolPermissions } from '@/domain/types';

export type LoginResponse = {
  token: string;
  permissions?: PatrolPermissions;
  user: unknown;
};

export function login(
  details: LoginRequest['details'],
  options: ApiRequestOptions = {},
): Promise<LoginResponse> {
  return callTypedAct(
    {
      service: 'main',
      model: 'user',
      act: 'login',
      details,
    },
    options,
  );
}
