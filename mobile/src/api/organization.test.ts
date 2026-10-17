import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchOrgRoad, roadFromOrgRows } from './organization';

vi.mock('./client', () => ({
  callTypedAct: vi.fn(),
}));

const { callTypedAct } = await import('./client');

const SESSION = { token: 't1' } as never;

/**
 * What the server actually sends.
 *
 * `organization.get` ends in `.toArray()` (back/src/organization/get/get.fn.ts), so the
 * act returns **an array of organization documents** — not an object. `callTypedAct`
 * unwraps `{ success, body }` and hands that array straight back, so reading `.road` off
 * it yields `undefined`.
 *
 * That is the bug this file exists to prevent: a first version typed the response as
 * `{ road }`, read `result.road`, got `undefined`, and reported "this organization has
 * no road" for the one organization that has one. The unit test could not catch it
 * because the mock had been given the shape the author expected rather than the shape
 * the server produces. Every case below uses the real array shape.
 */
const AHVAZ_ROAD = {
  _id: 'road-1',
  name: 'آزادراه اهواز – بندر امام',
  area: {
    type: 'MultiLineString' as const,
    coordinates: [
      [
        [48.67056, 31.31823],
        [48.67156, 31.31923],
      ],
    ],
  },
  origin: 'اهواز',
  destination: 'بندر امام',
  total_length_meters: 116342,
};

beforeEach(() => {
  vi.mocked(callTypedAct).mockReset();
});

describe('reading the road off an organization.get response', () => {
  it('reads it off the first row of the array the server sends', () => {
    const rows = [{ _id: 'org-1', code: 'AHR', road: AHVAZ_ROAD }];

    expect(roadFromOrgRows(rows)).toMatchObject({ _id: 'road-1', name: 'آزادراه اهواز – بندر امام' });
  });

  it('reports no road when the organization has none bound', () => {
    expect(roadFromOrgRows([{ _id: 'org-1', road: null }])).toBeNull();
    expect(roadFromOrgRows([{ _id: 'org-1' }])).toBeNull();
  });

  it('reports no road when the array is empty', () => {
    // A wrong id yields `[]`, not an error — an officer whose session points at an org
    // that no longer exists should get the standard map, not a crash.
    expect(roadFromOrgRows([])).toBeNull();
  });

  it('never treats the array itself as the road', () => {
    // The precise shape that broke it.
    expect(roadFromOrgRows([{ _id: 'org-1', road: AHVAZ_ROAD }])).not.toBe(
      undefined as unknown as typeof AHVAZ_ROAD,
    );
  });

  it('ignores a row whose road is not an object', () => {
    expect(roadFromOrgRows([{ _id: 'org-1', road: 'nonsense' }])).toBeNull();
    expect(roadFromOrgRows([{ _id: 'org-1', road: [] }])).toBeNull();
  });
});

describe('fetchOrgRoad over the wire', () => {
  it('takes the road from the row array the act returns', async () => {
    // The guard that would have caught the original defect: the mock is the server's
    // shape, not the author's.
    vi.mocked(callTypedAct).mockResolvedValue([
      { _id: 'org-1', code: 'AHR', road: AHVAZ_ROAD },
    ]);

    const result = await fetchOrgRoad(SESSION, 'org-1');

    expect(result.road).toMatchObject({ _id: 'road-1', name: 'آزادراه اهواز – بندر امام' });
  });

  it('reports no road rather than failing when the array is empty', async () => {
    vi.mocked(callTypedAct).mockResolvedValue([]);

    await expect(fetchOrgRoad(SESSION, 'org-missing')).resolves.toEqual({ road: null });
  });

  it('asks only for the road, so the org tree is not shipped on every press', async () => {
    vi.mocked(callTypedAct).mockResolvedValue([{ _id: 'org-1' }]);

    await fetchOrgRoad(SESSION, 'org-1');

    const request = vi.mocked(callTypedAct).mock.calls[0][0] as unknown as {
      details: { get: Record<string, unknown>; set: Record<string, unknown> };
    };
    expect(request.details.set).toEqual({ _id: 'org-1' });
    // The full `selectStruct('organization', 2)` expansion pulls in units, members,
    // parent unit and head; only `road` is wanted.
    expect(Object.keys(request.details.get)).toEqual(['road']);
    expect(Object.keys(request.details.get['road'] as object)).toContain('area');
  });
});