import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Session } from '@/domain/types';
import {
  fetchPatrolFormById,
  fetchPatrolForms,
  type PatrolForm,
  type PatrolFormResult,
} from '@/api/form-definition';
import { fetchPatrolProcess } from '@/api/accident-process';

import {
  downloadOrgForms,
  loadCachedForm,
  loadCachedFormIndex,
  loadCachedProcess,
  offlineFormCacheStatus,
} from './offline-forms-service';

/**
 * The service is the seam worth testing: it owns the decision that a download only
 * prunes once every form has been fetched, which is what keeps a dropped connection
 * from emptying a good cache. SQLite is stood in for with a map (the same pattern the
 * sync-worker and draft-service tests use) and the three acts are mocked, so the run
 * is pure logic.
 */
const stored = new Map<string, Record<string, unknown>>();

function key(scope: string, formKey: string): string {
  return `${scope}:${formKey}`;
}

vi.mock('@/storage/local-database', () => ({
  deleteOfflineForms: vi.fn(async (scope: string, keys: string[]) => {
    for (const k of keys) stored.delete(key(scope, k));
  }),
  getOfflineForm: vi.fn(async (scope: string, formKey: string) => {
    return stored.get(key(scope, formKey)) ?? null;
  }),
  listOfflineForms: vi.fn(async (scope: string) =>
    [...stored.values()].filter(entry => entry['scope'] === scope),
  ),
  saveOfflineForms: vi.fn(async (entries: Record<string, unknown>[]) => {
    for (const entry of entries) stored.set(key(String(entry['scope']), String(entry['form_key'])), { ...entry });
  }),
}));

vi.mock('@/api/form-definition', () => ({
  fetchPatrolFormById: vi.fn(),
  fetchPatrolForms: vi.fn(),
}));

vi.mock('@/api/accident-process', () => ({
  fetchPatrolProcess: vi.fn(),
}));

const SESSION = { device_id: 'd1', token: 't1', user: { _id: 'u1' } } as unknown as Session;

const ACCIDENT_FORM_DOC = {
  _id: 'fd-1',
  name: 'فرم تصادف',
  form_kind: 'accident',
  schema_version: 2,
  definition: { schemaVersion: 1, name: 'فرم تصادف', pages: [] },
} satisfies PatrolForm;

const ACCIDENT_FORM: PatrolFormResult = {
  form: ACCIDENT_FORM_DOC,
  options: { type: [{ _id: 't1', name: 'خسارتی' }] },
  version: { version: 3 },
};

/** The server's list of active forms: ids and titles only, no definitions. */
function stubList(ids: string[]): void {
  vi.mocked(fetchPatrolForms).mockResolvedValue(
    ids.map(id => ({ _id: id, name: `فرم ${id}`, form_kind: 'accident' as const })),
  );
}

beforeEach(() => {
  stored.clear();
  vi.mocked(fetchPatrolForms).mockReset();
  vi.mocked(fetchPatrolFormById).mockReset();
  vi.mocked(fetchPatrolProcess).mockReset();
  vi.mocked(fetchPatrolFormById).mockImplementation(async (_session, id) => ({
    ...ACCIDENT_FORM,
    form: { ...ACCIDENT_FORM_DOC, _id: id, name: `فرم ${id}` },
  }));
  vi.mocked(fetchPatrolProcess).mockResolvedValue({ process: null });
  stubList(['fd-1']);
});

describe('caching the organization\'s forms', () => {
  it('stores the resolved options alongside the definition', async () => {
    // A definition without its options map renders every dropdown empty, which an
    // officer on the road cannot tell apart from a form with no choices. The two are
    // cached as one unit or not at all.
    await downloadOrgForms(SESSION);

    expect(await loadCachedForm('fd-1')).toMatchObject({
      options: { type: [{ _id: 't1', name: 'خسارتی' }] },
      version: { version: 3 },
    });
  });

  it('fetches each listed form by id, because the list act returns no definition', async () => {
    stubList(['fd-1', 'fd-2']);

    await downloadOrgForms(SESSION);

    expect(fetchPatrolFormById).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchPatrolFormById).mock.calls.map(call => call[1])).toEqual(['fd-1', 'fd-2']);
  });

  it('caches the accident process wizard, the only one the app can route to', async () => {
    vi.mocked(fetchPatrolProcess).mockResolvedValue({
      process: { _id: 'p1', name: 'فرآیند', status: 'active', version: 2, steps: [] },
    });

    await downloadOrgForms(SESSION);

    // `resolveIncidentRoute` sends only تصادف to the process wizard, so caching the
    // other three would spend requests on definitions nothing could open.
    expect(fetchPatrolProcess).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchPatrolProcess).mock.calls[0][1]).toBe('accident');
    expect(await loadCachedProcess('accident')).toMatchObject({ process: { version: 2 } });
  });

  it('keeps a downloaded wizard when a later check for it fails', async () => {
    // The wizard is the org's, resolved from the officer's roles. Losing it to a
    // dropped connection or a temporary membership error would leave an officer who
    // came back online still unable to file on the road — the exact harm this cache
    // exists to prevent.
    vi.mocked(fetchPatrolProcess).mockResolvedValue({
      process: { _id: 'p1', name: 'فرآیند', status: 'active', version: 2, steps: [] },
    });
    await downloadOrgForms(SESSION);
    vi.mocked(fetchPatrolProcess).mockRejectedValue(new Error('temporary failure'));

    await downloadOrgForms(SESSION);

    expect(await loadCachedProcess('accident')).toMatchObject({ process: { version: 2 } });
  });

  it('drops the wizard when the organization genuinely stops publishing it', async () => {
    vi.mocked(fetchPatrolProcess).mockResolvedValue({
      process: { _id: 'p1', name: 'فرآیند', status: 'active', version: 2, steps: [] },
    });
    await downloadOrgForms(SESSION);
    vi.mocked(fetchPatrolProcess).mockResolvedValue({ process: null });

    await downloadOrgForms(SESSION);

    expect(await loadCachedProcess('accident')).toBeNull();
  });

  it('does not let a failed process fetch fail the forms it already has', async () => {
    // The two systems are independent; an org that published no wizard must not cost
    // the officer the forms they came for.
    vi.mocked(fetchPatrolProcess).mockRejectedValue(new Error('no membership'));

    const outcome = await downloadOrgForms(SESSION);

    expect(outcome.formCount).toBe(1);
    expect(await loadCachedForm('fd-1')).not.toBeNull();
  });
});

describe('a download that did not finish', () => {
  it('keeps the forms already stored when one fetch fails', async () => {
    await downloadOrgForms(SESSION);
    stubList(['fd-1', 'fd-2']);
    vi.mocked(fetchPatrolFormById).mockImplementation(async (_session, id) => {
      if (id === 'fd-2') throw new Error('connection reset');
      return ACCIDENT_FORM;
    });

    await expect(downloadOrgForms(SESSION)).rejects.toThrow('connection reset');

    // The dangerous case: a partial run that treated what it never reached as
    // withdrawn and left the officer with nothing to file offline.
    expect(await loadCachedForm('fd-1')).not.toBeNull();
  });

  it('keeps a form the organization archived between downloads', async () => {
    await downloadOrgForms(SESSION);
    stubList([]);
    // `gets` answered with an empty list, so the form is genuinely withdrawn rather
    // than merely unfetched — this run did complete.
    vi.mocked(fetchPatrolFormById).mockClear();

    await downloadOrgForms(SESSION);

    expect(vi.mocked(fetchPatrolFormById)).not.toHaveBeenCalled();
    expect(await loadCachedForm('fd-1')).toBeNull();
  });

  it('leaves an old copy in place when the list itself fails', async () => {
    await downloadOrgForms(SESSION);
    vi.mocked(fetchPatrolForms).mockRejectedValue(new Error('offline'));

    await expect(downloadOrgForms(SESSION)).rejects.toThrow('offline');
    expect(await loadCachedForm('fd-1')).not.toBeNull();
  });

  it('runs one download even when the button is pressed twice', async () => {
    // Two taps must not race two prune passes, where the second could delete a form
    // the first had just stored.
    const [first, second] = await Promise.all([downloadOrgForms(SESSION), downloadOrgForms(SESSION)]);

    expect(fetchPatrolForms).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });
});

describe('what the officer is told', () => {
  it('names the forms whose version moved on', async () => {
    await downloadOrgForms(SESSION);
    stubList(['fd-1']);
    vi.mocked(fetchPatrolFormById).mockResolvedValue({ ...ACCIDENT_FORM, version: { version: 9 } });

    const outcome = await downloadOrgForms(SESSION);

    // The full payload's name wins over the list act's, which only carries a title.
    expect(outcome.changed).toEqual(['فرم تصادف']);
  });

  it('says nothing changed when a refresh returned the same version', async () => {
    // Otherwise an officer who refreshes on good signal is told their forms were
    // updated every time, and stops believing the message.
    await downloadOrgForms(SESSION);

    const outcome = await downloadOrgForms(SESSION);

    expect(outcome.changed).toEqual([]);
  });

  it('reports an empty cache as empty, so the officer knows before leaving base', async () => {
    const status = await offlineFormCacheStatus();

    expect(status).toMatchObject({ formCount: 0, hasProcess: false });
  });

  it('counts what it stored', async () => {
    stubList(['fd-1', 'fd-2']);

    const outcome = await downloadOrgForms(SESSION);

    expect(outcome.formCount).toBe(2);
    expect(await offlineFormCacheStatus()).toMatchObject({ formCount: 2 });
  });
});

describe('reading the cache back', () => {
  it('lists the picker rows the entry screen needs', async () => {
    stubList(['fd-1', 'fd-2']);

    await downloadOrgForms(SESSION);

    expect(await loadCachedFormIndex()).toEqual([
      { _id: 'fd-1', name: 'فرم fd-1', form_kind: 'accident' },
      { _id: 'fd-2', name: 'فرم fd-2', form_kind: 'accident' },
    ]);
  });

  it('reports nothing cached rather than an error when a form was never downloaded', async () => {
    expect(await loadCachedForm('fd-missing')).toBeNull();
    expect(await loadCachedProcess('accident')).toBeNull();
    expect(await loadCachedFormIndex()).toEqual([]);
  });
});