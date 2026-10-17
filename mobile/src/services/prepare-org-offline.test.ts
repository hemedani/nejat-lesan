import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PatrolOrganization, Session } from '@/domain/types';

import { prepareOrgOffline } from './prepare-org-offline';

const ORG: PatrolOrganization = { _id: 'org-1', code: 'AHR', name: 'آزادراه اهواز' };
const SESSION = { device_id: 'd1', token: 't1', user: { _id: 'u1' } } as unknown as Session;

vi.mock('@/api/form-definition', () => ({ fetchPatrolForms: vi.fn(async () => []) }));
vi.mock('@/api/accident-process', () => ({ fetchPatrolProcess: vi.fn(async () => ({ process: null })) }));
vi.mock('@/storage/local-database', () => ({
  deleteOfflineForms: vi.fn(),
  getOfflineForm: vi.fn(async () => null),
  listOfflineForms: vi.fn(async () => []),
  saveOfflineForms: vi.fn(),
  getOrgRoadGeometry: vi.fn(async () => null),
  saveOrgRoadGeometry: vi.fn(),
  deleteOrgRoadGeometry: vi.fn(),
}));
vi.mock('@/api/organization', () => ({ fetchOrgRoad: vi.fn() }));

const { fetchOrgRoad } = await import('@/api/organization');

beforeEach(() => {
  vi.mocked(fetchOrgRoad).mockReset();
  vi.mocked(fetchOrgRoad).mockResolvedValue({ road: null });
});

describe('preparing a device for offline work', () => {
  it('fetches both the forms and the road', async () => {
    const outcome = await prepareOrgOffline(SESSION, ORG);

    expect(outcome).toMatchObject({ forms: 0, road: 'none' });
    expect(fetchOrgRoad).toHaveBeenCalledWith(SESSION, 'org-1');
  });

  it('reports the road separately, so the officer knows the map is covered', async () => {
    vi.mocked(fetchOrgRoad).mockResolvedValue({
      road: {
        _id: 'road-1',
        name: 'آزادراه اهواز – بندر امام',
        area: { type: 'MultiLineString', coordinates: [[[48.6, 31.3], [48.7, 31.4]]] },
      },
    });

    const outcome = await prepareOrgOffline(SESSION, ORG);

    expect(outcome).toMatchObject({ road: 'stored', roadName: 'آزادراه اهواز – بندر امام' });
  });

  it('still reports the forms when the road lookup fails', async () => {
    // The two halves are independent. An officer whose organization's road cannot be
    // read must not lose the forms they came for, and must not be told the whole
    // preparation failed.
    vi.mocked(fetchOrgRoad).mockRejectedValue(new Error('offline'));

    const outcome = await prepareOrgOffline(SESSION, ORG);

    expect(outcome.forms).toBe(0);
    expect(outcome.road).toBe('failed');
  });

  it('fails loudly when the forms cannot be fetched', async () => {
    // The forms are the half the officer came for; a silent success here would tell
    // them they are ready for the road when the form they file on is missing.
    const { fetchPatrolForms } = await import('@/api/form-definition');
    vi.mocked(fetchPatrolForms).mockRejectedValueOnce(new Error('server down'));

    await expect(prepareOrgOffline(SESSION, ORG)).rejects.toThrow('server down');
  });

  it('needs no organization to be given one', async () => {
    await expect(prepareOrgOffline(SESSION, null)).rejects.toThrow();

    // A global or multi-org caller has no single org to scope a road to, so nothing
    // is fetched and nothing is claimed.
    expect(fetchOrgRoad).not.toHaveBeenCalled();
  });
});