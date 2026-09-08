import type { BackendActRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { ActiveShift, PatrolPermissions, Session } from '@/domain/types';

export type MeProfile = {
  _id: string;
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  email?: string;
  patrol_permissions?: PatrolPermissions;
  is_active?: boolean;
  /** Added server-side for Patrol users; null when no shift is active. */
  activeShift?: ActiveShift | null;
  /** Added server-side; count of the officer's active devices. */
  activeDevicesCount?: number;
  /** Installation-level enabled module keys (backend v2); absent on older backends. */
  modules?: string[];
  /** Effective org module keys when the caller resolves to exactly one org; else null. */
  orgModules?: string[] | null;
};

type GetMeRequest = BackendActRequest<'main', 'user', 'getMe'>;

const ME_GET = {
  _id: 1,
  first_name: 1,
  last_name: 1,
  personnel_code: 1,
  email: 1,
  patrol_permissions: 1,
} as const;

/**
 * Profile refresh source (`user.getMe`): profile fields plus the
 * server-derived active shift and active device count.
 */
export function fetchMe(session: Session, options: ApiRequestOptions = {}): Promise<MeProfile> {
  const request = {
    service: 'main',
    model: 'user',
    act: 'getMe',
    details: {
      set: {},
      get: ME_GET,
    },
  } as unknown as GetMeRequest;

  return callTypedAct<'main', 'user', 'getMe', MeProfile>(request as never, {
    token: session.token,
    ...options,
  });
}
