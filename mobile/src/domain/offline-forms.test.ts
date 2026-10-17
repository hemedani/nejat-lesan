import { describe, expect, it } from 'vitest';

import {
  changedFormNames,
  describeOfflineFormCache,
  orgFormsAvailability,
  parseOfflineFormRow,
  staleKeysToRemove,
  summarizeOfflineForms,
  type OfflineFormEntry,
  type OfflineFormRow,
} from './offline-forms';

const NOW = Date.parse('2026-10-17T12:00:00.000Z');

const entry = (overrides: Partial<OfflineFormEntry> = {}): OfflineFormEntry => ({
  scope: 'form_definition',
  form_key: 'fd-1',
  name: 'فرم تصادف',
  form_kind: 'accident',
  version: 1,
  payload: {},
  fetched_at: '2026-10-17T08:00:00.000Z',
  ...overrides,
});

const row = (overrides: Partial<OfflineFormRow> = {}): OfflineFormRow => ({
  scope: 'form_definition',
  form_key: 'fd-1',
  name: 'فرم تصادف سازمان',
  form_kind: 'accident',
  version: 3,
  payload_json: JSON.stringify({ form: { _id: 'fd-1' }, options: { type: [] }, version: { version: 3 } }),
  fetched_at: '2026-10-17T08:00:00.000Z',
  ...overrides,
});

describe('parseOfflineFormRow', () => {
  it('reads a stored form_definition row back with its payload', () => {
    const entry = parseOfflineFormRow(row());

    expect(entry).toMatchObject({
      scope: 'form_definition',
      form_key: 'fd-1',
      name: 'فرم تصادف سازمان',
      form_kind: 'accident',
      version: 3,
      fetched_at: '2026-10-17T08:00:00.000Z',
    });
    expect(entry?.payload).toMatchObject({ version: { version: 3 } });
  });

  it('keeps a process row, which names no form kind', () => {
    const entry = parseOfflineFormRow(
      row({ scope: 'accident_process', form_key: 'accident', form_kind: null, name: 'فرآیند ثبت' }),
    );

    expect(entry).toMatchObject({ scope: 'accident_process', form_key: 'accident' });
    expect(entry?.form_kind).toBeUndefined();
  });

  it('drops a row whose payload is not a JSON object', () => {
    // A definition without its options map renders empty dropdowns, which is worse
    // than not having cached it — so a corrupt row reads as "not cached" and the
    // officer gets the built-in form rather than a wizard full of blanks.
    expect(parseOfflineFormRow(row({ payload_json: '{not json' }))).toBeNull();
    expect(parseOfflineFormRow(row({ payload_json: 'null' }))).toBeNull();
    expect(parseOfflineFormRow(row({ payload_json: '[1,2,3]' }))).toBeNull();
  });

  it('drops a row from a scope this build does not know', () => {
    expect(parseOfflineFormRow(row({ scope: 'something_else' }))).toBeNull();
  });

  it('accepts a version that arrived as a string', () => {
    expect(parseOfflineFormRow(row({ version: '4' as unknown as number }))?.version).toBe(4);
  });

  it('normalizes a stored kind this build does not know to an accident form', () => {
    // The backend defaults `form_kind` to accident, so trusting the stored value
    // would send an officer's report to a form the org never authored.
    expect(parseOfflineFormRow(row({ form_kind: 'nonsense' }))?.form_kind).toBe('accident');
  });

  it('drops a row with no key, which cannot be looked up again', () => {
    expect(parseOfflineFormRow(row({ form_key: '' }))).toBeNull();
  });
});

describe('offline form cache summary', () => {
  it('says plainly that nothing is stored, rather than implying it is ready', () => {
    // The officer reads this line to decide whether they can rely on the road. An
    // empty cache presented as a finished one sends them out unprepared.
    expect(describeOfflineFormCache(summarizeOfflineForms([]), NOW)).toBe(
      'فرمی برای استفاده آفلاین ذخیره نشده',
    );
  });

  it('counts authored forms and the process wizard separately', () => {
    const status = summarizeOfflineForms([
      entry(),
      entry({ form_key: 'fd-2', form_kind: 'incident_report' }),
      entry({ scope: 'accident_process', form_key: 'accident', form_kind: undefined }),
    ]);

    expect(status).toMatchObject({ formCount: 2, hasProcess: true });
    expect(describeOfflineFormCache(status, NOW)).toContain('۲ فرم و ۱ فرآیند');
  });

  it('omits the process clause when the org published no wizard', () => {
    const status = summarizeOfflineForms([entry(), entry({ form_key: 'fd-2' })]);

    expect(describeOfflineFormCache(status, NOW)).toContain('۲ فرم ذخیره شده');
    expect(describeOfflineFormCache(status, NOW)).not.toContain('فرآیند');
  });

  it('reports the most recent download, not the oldest one', () => {
    // A cache refreshed this morning must not be described as a week-old one, or the
    // officer refreshes it needlessly; and the reverse would hide a genuinely stale
    // cache until it silently failed to open.
    const status = summarizeOfflineForms([
      entry({ form_key: 'fd-1', fetched_at: '2026-10-01T08:00:00.000Z' }),
      entry({ form_key: 'fd-2', fetched_at: '2026-10-17T10:00:00.000Z' }),
    ]);

    expect(status.fetchedAt).toBe('2026-10-17T10:00:00.000Z');
    expect(describeOfflineFormCache(status, NOW)).toContain('۲ ساعت پیش');
  });

  it('never claims a relative age for a date it cannot read', () => {
    const status = summarizeOfflineForms([entry({ fetched_at: 'not-a-date' })]);

    expect(describeOfflineFormCache(status, NOW)).toContain('۱ فرم ذخیره شده');
    expect(describeOfflineFormCache(status, NOW)).not.toContain('پیش');
  });

  it('counts days once the download is more than a day old', () => {
    const status = summarizeOfflineForms([
      entry({ fetched_at: new Date(NOW - 3 * 24 * 3_600_000).toISOString() }),
    ]);

    expect(describeOfflineFormCache(status, NOW)).toContain('۳ روز پیش');
  });
});

describe('authoritative pruning', () => {
  const existing = [
    entry({ form_key: 'fd-1' }),
    entry({ form_key: 'fd-2' }),
    entry({ form_key: 'fd-3' }),
    entry({ scope: 'accident_process', form_key: 'accident' }),
  ];

  it('removes a form the organization no longer publishes', () => {
    // A withdrawn form must not stay fillable offline: the officer would file a
    // report on a workflow their organization has retired.
    expect(staleKeysToRemove(existing, 'form_definition', ['fd-1', 'fd-3'])).toEqual(['fd-2']);
  });

  it('leaves the other scope alone', () => {
    // The process wizard and the authored forms are separate downloads; pruning one
    // must not delete what the other just fetched.
    expect(staleKeysToRemove(existing, 'form_definition', ['fd-1'])).not.toContain('accident');
  });

  it('removes everything when the organization publishes nothing at all', () => {
    expect(staleKeysToRemove(existing, 'form_definition', [])).toEqual(['fd-1', 'fd-2', 'fd-3']);
  });
});

describe('reporting what a download changed', () => {
  it('names a form whose version moved on', () => {
    const previous = [entry({ form_key: 'fd-1', name: 'فرم الف', version: 2 })];
    const incoming = [entry({ form_key: 'fd-1', name: 'فرم الف', version: 3 })];

    expect(changedFormNames(previous, incoming)).toEqual(['فرم الف']);
  });

  it('names a form that was not stored before', () => {
    expect(changedFormNames([], [entry({ name: 'فرم ب' })])).toEqual(['فرم ب']);
  });

  it('says nothing when the download brought the same versions back', () => {
    // The common case: an officer refreshes on good signal and nothing moved. A toast
    // claiming «۳ فرم به‌روزرسانی شد» would train them to distrust it.
    const previous = [entry({ version: 2 }), entry({ form_key: 'fd-2', name: 'فرم ب', version: 5 })];
    const incoming = [entry({ version: 2 }), entry({ form_key: 'fd-2', name: 'فرم ب', version: 5 })];

    expect(changedFormNames(previous, incoming)).toEqual([]);
  });
});
describe('whether the download control belongs on screen at all', () => {
  it('is available when the officer has an org, the module is on, and there is signal', () => {
    expect(orgFormsAvailability({ hasOrganization: true, moduleEnabled: true, offline: false })).toEqual({
      visible: true,
      enabled: true,
      reason: null,
    });
  });

  it('hides itself when the organization cannot be determined', () => {
    // `primaryOrganization` is null for a global or multi-org caller. The backend
    // resolves the org from `user.roles`, so there is no single org to scope a cache
    // to — and the card already says «سازمانی ثبت نشده».
    expect(orgFormsAvailability({ hasOrganization: false, moduleEnabled: true, offline: false }).visible).toBe(false);
  });

  it('hides itself when the patrol module is off for this organization', () => {
    // The backend throws its own Persian «این ماژول برای این سازمان فعال نیست» and the
    // entry screen already surfaces it. A button here could only ever report a
    // failure, which is a reason the officer cannot act on.
    expect(orgFormsAvailability({ hasOrganization: true, moduleEnabled: false, offline: false }).visible).toBe(false);
  });

  it('stays visible but disabled while offline, and says why', () => {
    // Removing the control would leave the officer wondering where the button went;
    // leaving it enabled would just fail. Naming the reason is the honest middle.
    const availability = orgFormsAvailability({ hasOrganization: true, moduleEnabled: true, offline: true });

    expect(availability).toMatchObject({ visible: true, enabled: false });
    expect(availability.reason).toBe('برای دریافت فرم‌ها اتصال اینترنت لازم است');
  });
});
