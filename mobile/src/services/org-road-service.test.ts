import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OrgRoadDocument } from '@/api/organization';

import type { PatrolOrganization, Session } from '@/domain/types';

import { downloadOrgRoad, loadCachedOrgRoad, snapToCachedOrgRoad } from './org-road-service';

const ORG: PatrolOrganization = { _id: 'org-1', code: 'AHR', name: 'آزادراه اهواز' };

const SESSION = { device_id: 'd1', token: 't1', user: { _id: 'u1' } } as unknown as Session;

/**
 * The service is the seam worth testing: it owns the decision that an organization
 * without a road is a normal outcome rather than a failure, and that a fetch which
 * fails leaves the stored road alone. SQLite is stood in for with a map (the pattern the
 * sync-worker and offline-forms tests use) and the act is mocked.
 */
const stored = new Map<string, Record<string, unknown>>();

vi.mock('@/storage/local-database', () => ({
  deleteOrgRoadGeometry: vi.fn(async (organizationId: string) => {
    stored.delete(organizationId);
  }),
  getOrgRoadGeometry: vi.fn(async (organizationId: string) => stored.get(organizationId) ?? null),
  saveOrgRoadGeometry: vi.fn(async (entry: Record<string, unknown>) => {
    stored.set(String(entry['organizationId']), { ...entry });
  }),
}));

vi.mock('@/api/organization', () => ({
  fetchOrgRoad: vi.fn(),
}));

const { fetchOrgRoad } = await import('@/api/organization');

const ROAD: OrgRoadDocument = {
  _id: 'road-1',
  name: 'آزادراه اهواز – بندر امام',
  area: {
    type: 'MultiLineString' as const,
    coordinates: [[[48.67056, 31.31823], [48.67256, 31.32023]]],
  },
  origin: 'اهواز',
  destination: 'بندر امام',
};

beforeEach(() => {
  stored.clear();
  vi.mocked(fetchOrgRoad).mockReset();
  vi.mocked(fetchOrgRoad).mockResolvedValue({ road: ROAD });
});

describe('storing the officer’s own road', () => {
  it('caches the road so the map can draw it with no signal', async () => {
    await downloadOrgRoad(SESSION, ORG);

    const cached = await loadCachedOrgRoad(ORG._id);
    expect(cached).toMatchObject({ roadId: 'road-1', name: 'آزادراه اهواز – بندر امام' });
  });

  it('looks the organization up by the id the session already carries', async () => {
    // No extra round trip to resolve "which org" — the session has it, and a device
    // out of coverage has to answer this offline.
    await downloadOrgRoad(SESSION, ORG);

    expect(fetchOrgRoad).toHaveBeenCalledWith(SESSION, 'org-1');
  });

  it('reports an organization with no road as having none, not as a failure', async () => {
    // A municipality organization legitimately has no road — the relation is optional.
    vi.mocked(fetchOrgRoad).mockResolvedValue({ road: null });

    const outcome = await downloadOrgRoad(SESSION, ORG);

    expect(outcome).toMatchObject({ status: 'none' });
    expect(await loadCachedOrgRoad(ORG._id)).toBeNull();
  });

  it('keeps the stored road when the lookup fails', async () => {
    await downloadOrgRoad(SESSION, ORG);
    vi.mocked(fetchOrgRoad).mockRejectedValue(new Error('offline'));

    // Throwing away a road an officer already has would leave the map blank for a
    // reason that has nothing to do with the road.
    await expect(downloadOrgRoad(SESSION, ORG)).rejects.toThrow('offline');
    expect(await loadCachedOrgRoad(ORG._id)).not.toBeNull();
  });

  it('replaces the stored road when the organization is rebound to another one', async () => {
    await downloadOrgRoad(SESSION, ORG);
    vi.mocked(fetchOrgRoad).mockResolvedValue({ road: { ...ROAD, _id: 'road-2', name: 'بزرگراه دوم' } });

    await downloadOrgRoad(SESSION, ORG);

    const cached = await loadCachedOrgRoad(ORG._id);
    expect(cached).toMatchObject({ roadId: 'road-2', name: 'بزرگراه دوم' });
  });

  it('still caches a road that has no geometry, so the status can say so honestly', async () => {
    // Every production road looks like this. Storing nothing would make the cache
    // indistinguishable from "never pressed the button", and the officer would have no
    // way to tell a data gap from a missing download.
    vi.mocked(fetchOrgRoad).mockResolvedValue({ road: { _id: 'road-1', name: 'جاده گلف' } });

    await downloadOrgRoad(SESSION, ORG);

    expect(await loadCachedOrgRoad(ORG._id)).toMatchObject({ roadId: 'road-1' });
  });

  it('reports nothing stored rather than an error when nothing was downloaded', async () => {
    expect(await loadCachedOrgRoad('org-unknown')).toBeNull();
  });
});

describe('snapping to the cached road with no signal', () => {
  const NEAR_BY = { latitude: 31.32, longitude: 48.671 };

  it('computes the road reference from the stored geometry', async () => {
    await downloadOrgRoad(SESSION, ORG);

    const snap = await snapToCachedOrgRoad(ORG._id, NEAR_BY);

    expect(snap).toMatchObject({ road_id: 'road-1', road_name: 'آزادراه اهواز – بندر امام' });
  });

  it('reports no road reference when the organization has no stored road', async () => {
    // The picker then keeps its «اطلاعات راه پس از اتصال تکمیل میشود» notice and
    // the sync worker resolves the snap later, rather than showing a fake one.
    expect(await snapToCachedOrgRoad('org-unknown', NEAR_BY)).toBeNull();
  });

  it('reports no road reference for a stored road without geometry', async () => {
    vi.mocked(fetchOrgRoad).mockResolvedValue({ road: { _id: 'road-1', name: 'جاده گلف' } });
    await downloadOrgRoad(SESSION, ORG);

    expect(await snapToCachedOrgRoad(ORG._id, NEAR_BY)).toBeNull();
  });
});