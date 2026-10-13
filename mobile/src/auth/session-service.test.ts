import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Session } from '@/domain/types';
import type { SessionRepository } from '@/storage/session-repository';

const loginMock = vi.fn();
const connectivityMock = vi.fn(async () => ({ status: 'online' }));
const deviceMetadataMock = vi.fn(async () => ({
  device_id: 'dev-1',
  fingerprint: 'fp',
  platform: 'android',
  app_version: '1.0.0',
  model: 'Pixel',
}));

vi.mock('@/api/auth', () => ({ login: (...args: unknown[]) => loginMock(...args) }));
vi.mock('@/services/connectivity', () => ({
  getConnectivitySnapshot: () => connectivityMock(),
}));
// Pulls in expo-secure-store → react-native, which the node test environment
// cannot parse. Every test here injects its own repository anyway.
vi.mock('@/storage/session-repository', () => ({
  createSecureSessionRepository: () => {
    throw new Error('the default repository must not be constructed in tests');
  },
}));
vi.mock('./device-metadata', () => ({ getDeviceMetadata: () => deviceMetadataMock() }));

const { createSessionService } = await import('./session-service');

function memoryRepository(): SessionRepository & { saved: Session[] } {
  const saved: Session[] = [];
  return {
    saved,
    readSession: async () => null,
    saveSession: async (session) => {
      saved.push(session);
    },
    clearSession: async () => undefined,
    readCache: async () => null,
    saveCache: async () => undefined,
    clearCache: async () => undefined,
  };
}

function respondWith(primaryOrganization: unknown) {
  loginMock.mockResolvedValue({
    token: 'tok',
    user: { _id: 'u1', first_name: 'علی', last_name: 'رضایی' },
    modules: ['incident_patrol'],
    orgModules: ['incident_patrol'],
    primaryOrganization,
  });
}

async function loginAndCapture(): Promise<Session> {
  const repository = memoryRepository();
  const session = await createSessionService(repository).login('a@b.c', 'pw');
  expect(repository.saved).toHaveLength(1);
  return session;
}

describe('session organization', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('carries a valid organization onto the session', async () => {
    respondWith({
      _id: 'o1',
      code: 'AHR',
      name: 'شرکت ره',
      enName: 'RAH',
      location: { type: 'Point', coordinates: [48.67056, 31.31823] },
      location_zoom: 13,
    });

    const session = await loginAndCapture();
    expect(session.primaryOrganization).toEqual({
      _id: 'o1',
      code: 'AHR',
      name: 'شرکت ره',
      enName: 'RAH',
      location: { type: 'Point', coordinates: [48.67056, 31.31823] },
      location_zoom: 13,
    });
  });

  it('stores null when the caller has no single organization', async () => {
    respondWith(null);
    expect((await loginAndCapture()).primaryOrganization).toBeNull();
  });

  it('stores null when the field is absent, as on an older backend', async () => {
    respondWith(undefined);
    expect((await loginAndCapture()).primaryOrganization).toBeNull();
  });

  it('drops a malformed organization instead of blocking the login', async () => {
    // The whole point: a bad org must cost the officer their org card, not
    // their session.
    respondWith({ code: 'AHR', name: 'بدون شناسه' });
    expect((await loginAndCapture()).primaryOrganization).toBeNull();
  });

  it('drops a non-object organization', async () => {
    respondWith('AHR');
    expect((await loginAndCapture()).primaryOrganization).toBeNull();
  });

  it('keeps an organization whose location is missing but whose identity is not', async () => {
    respondWith({ _id: 'o2', code: 'MUN', name: 'شهرداری' });
    const session = await loginAndCapture();
    expect(session.primaryOrganization?.name).toBe('شهرداری');
    expect(session.primaryOrganization?.location).toBeUndefined();
  });
});