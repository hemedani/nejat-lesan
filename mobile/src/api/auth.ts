import type { LoginRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { PatrolPermissions } from '@/domain/types';

export type LoginResponse = {
  token: string;
  permissions?: PatrolPermissions;
  user: unknown;
  /** Installation-level enabled module keys (backend v2); absent on older backends. */
  modules?: string[];
  /** Effective org module keys when the caller resolves to exactly one org; else null. */
  orgModules?: string[] | null;
  /**
   * Server-resolved organization, a fixed response field rather than a client
   * projection — `null` for global and multi-org callers. Validated by
   * `normalizeOrganization`, which drops a malformed value instead of throwing,
   * so a bad org can never block a login.
   */
  primaryOrganization?: unknown;
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
