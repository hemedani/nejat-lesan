import { login, type LoginResponse } from '@/api/auth';
import { ApiError } from '@/api/errors';
import { getConnectivitySnapshot } from '@/services/connectivity';
import type { Session, User } from '@/domain/types';
import { createSecureSessionRepository, type SessionRepository } from '@/storage/session-repository';

import { getDeviceMetadata } from './device-metadata';

export type SessionService = {
  login(email: string, password: string): Promise<Session>;
  restore(): Promise<Session | null>;
  updateLastSync(): Promise<void>;
  logout(): Promise<void>;
  handleRevokedSession(): Promise<void>;
};

function normalizeUser(value: unknown): User {
  if (!value || typeof value !== 'object') {
    throw new ApiError('Invalid user response.', 'invalid_response');
  }
  const user = value as Partial<User>;
  if (!user._id || !user.first_name || !user.last_name) {
    throw new ApiError('Incomplete user response.', 'invalid_response');
  }
  return {
    _id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    personnel_code: user.personnel_code,
    permissions: (value as Record<string, unknown>).patrol_permissions as
      | User['permissions']
      | undefined,
  };
}

function toSession(response: LoginResponse, deviceId: string): Session {
  if (!response.token) {
    throw new ApiError('Missing session token.', 'invalid_response');
  }
  return {
    token: response.token,
    user: normalizeUser(response.user),
    device_id: deviceId,
  };
}

function toCache(session: Session) {
  return {
    user_id: session.user._id,
    ...(session.user.personnel_code ? { personnel_code: session.user.personnel_code } : {}),
    display_name: `${session.user.first_name} ${session.user.last_name}`,
    permissions: session.user.permissions,
  };
}

export function createSessionService(
  repository: SessionRepository = createSecureSessionRepository(),
): SessionService {
  return {
    async login(email, password) {
      const connectivity = await getConnectivitySnapshot();
      if (connectivity.status === 'offline') {
        throw new ApiError('First login requires an internet connection.', 'offline');
      }

      const device = await getDeviceMetadata();
      const response = await login(
        {
          set: {
            email,
            password,
            device,
          },
          get: {
            token: 1,
            permissions: 1,
            user: {
              _id: 1,
              first_name: 1,
              last_name: 1,
              personnel_code: 1,
              patrol_permissions: 1,
              devices: {
                _id: 1,
                device_id: 1,
                is_active: 1,
              },
            },
          },
        },
      );
      const session = toSession(response, device.device_id);
      await repository.saveSession(session);
      await repository.saveCache(toCache(session));
      return session;
    },
    restore() {
      return repository.readSession();
    },
    async updateLastSync() {
      const cache = await repository.readCache();
      await repository.saveCache({
        ...cache,
        last_sync_at: new Date().toISOString(),
      });
    },
    async logout() {
      await repository.clearSession();
    },
    async handleRevokedSession() {
      await repository.clearSession();
    },
  };
}