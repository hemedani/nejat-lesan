import type { Session } from '@/domain/types';

import type { KeyValueStore, NonSensitiveCache } from './contracts';
import { secureKeyValueStore } from './secure-store';

const SESSION_KEY = 'lesen.session.v1';
const CACHE_KEY = 'lesen.identity-cache.v1';

export type SessionRepository = {
  readSession(): Promise<Session | null>;
  saveSession(session: Session): Promise<void>;
  clearSession(): Promise<void>;
  readCache(): Promise<NonSensitiveCache | null>;
  saveCache(cache: NonSensitiveCache): Promise<void>;
  clearCache(): Promise<void>;
};

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function createSessionRepository(
  secureStore: KeyValueStore,
  cacheStore: KeyValueStore = secureStore,
): SessionRepository {
  return {
    async readSession() {
      return parseJson<Session>(await secureStore.getItem(SESSION_KEY));
    },
    async saveSession(session) {
      await secureStore.setItem(SESSION_KEY, JSON.stringify(session));
    },
    clearSession() {
      return secureStore.deleteItem(SESSION_KEY);
    },
    async readCache() {
      return parseJson<NonSensitiveCache>(await cacheStore.getItem(CACHE_KEY));
    },
    async saveCache(cache) {
      await cacheStore.setItem(CACHE_KEY, JSON.stringify(cache));
    },
    clearCache() {
      return cacheStore.deleteItem(CACHE_KEY);
    },
  };
}

export function createSecureSessionRepository(
  cacheStore: KeyValueStore = secureKeyValueStore,
): SessionRepository {
  return createSessionRepository(secureKeyValueStore, cacheStore);
}