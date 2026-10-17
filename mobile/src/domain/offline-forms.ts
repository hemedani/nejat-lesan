/**
 * The organization's own forms, as stored on the device.
 *
 * An officer on the road cannot reach the backend, so the form their organization
 * authored has to be on the phone before they leave. Two independent systems produce
 * those forms — `form_definition` (rendered by the shared `@forms` engine) and the
 * legacy `accident_process` wizard — so one table and one set of accessors carry both
 * rather than each system growing its own cache and its own staleness story.
 *
 * Everything here is pure: `expo-sqlite` cannot run under vitest, so the row mapping
 * and every decision about those rows are separated from the SQL that stores them.
 */

/** Which authoring system a stored form came from. */
import type { FormKind } from './form-picker';

export type OfflineFormScope = 'form_definition' | 'accident_process';

export const OFFLINE_FORM_SCOPES: readonly OfflineFormScope[] = ['form_definition', 'accident_process'];

/** One stored form, already resolved out of its JSON column. */
export type OfflineFormEntry = {
  scope: OfflineFormScope;
  /** `form_definition`: the form's `_id`. `accident_process`: the incident type. */
  form_key: string;
  name: string;
  /** Which report collection the form files into. Absent for a process wizard. */
  form_kind?: FormKind;
  version: number;
  /** The whole `getForPatrol` result, options map included. */
  payload: unknown;
  fetched_at: string;
};

/** The raw column values, as SQLite hands them back. */
export type OfflineFormRow = {
  scope: string;
  form_key: string;
  name: string;
  form_kind: string | null;
  version: number;
  payload_json: string;
  fetched_at: string;
};

function isFormScope(value: string): value is OfflineFormScope {
  return OFFLINE_FORM_SCOPES.includes(value as OfflineFormScope);
}

/**
 * Resolve a stored row, or `null` when it cannot be trusted.
 *
 * Null beats a throw: a corrupt row has to degrade to "this form is not cached" so
 * the officer lands on the built-in form, rather than aborting the screen that was
 * only trying to list what the device already had.
 */
export function parseOfflineFormRow(row: OfflineFormRow): OfflineFormEntry | null {
  if (!isFormScope(row.scope) || row.form_key.length === 0) {
    return null;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return null;
  }
  const version = Number(row.version);
  return {
    scope: row.scope,
    form_key: row.form_key,
    name: row.name,
    // The backend defaults `form_kind` to accident, so an unknown stored value must
    // normalize the same way rather than sending the report to the wrong collection.
    // A process wizard files no collection of its own, so it declares no kind.
    form_kind:
      row.scope === 'accident_process'
        ? undefined
        : row.form_kind === 'incident_report'
          ? 'incident_report'
          : 'accident',
    version: Number.isFinite(version) ? version : 0,
    payload,
    fetched_at: row.fetched_at,
  };
}

// ---------------------------------------------------------------------------
// What the org card says about the cache
// ---------------------------------------------------------------------------

export type OfflineFormCacheStatus = {
  /** How many authored `form_definition` forms the device holds. */
  formCount: number;
  /** Whether the legacy org process wizard is stored too. */
  hasProcess: boolean;
  /** The newest `fetched_at` across every stored form, or `null` for an empty cache. */
  fetchedAt: string | null;
};

/** What the device holds, in the counts the org card reports. */
export function summarizeOfflineForms(entries: readonly OfflineFormEntry[]): OfflineFormCacheStatus {
  const timestamps = entries
    .map(entry => Date.parse(entry.fetched_at))
    .filter(time => Number.isFinite(time));
  return {
    formCount: entries.filter(entry => entry.scope === 'form_definition').length,
    hasProcess: entries.some(entry => entry.scope === 'accident_process'),
    fetchedAt: timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null,
  };
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * How long ago the download happened, in Persian.
 *
 * The officer reads this to judge whether the forms are current, so an unreadable
 * date returns `null` rather than a confident «همین حالا» — a wrong age is worse
 * than no age.
 */
export function describeCacheAge(fetchedAt: string, nowMs: number): string | null {
  const then = Date.parse(fetchedAt);
  if (!Number.isFinite(then)) {
    return null;
  }
  const age = nowMs - then;
  if (age < MINUTE_MS) return 'همین حالا';
  if (age < HOUR_MS) return `${fa(age / MINUTE_MS)} دقیقه پیش`;
  if (age < DAY_MS) return `${fa(age / HOUR_MS)} ساعت پیش`;
  return `${fa(age / DAY_MS)} روز پیش`;
}

/**
 * The one line under the org card that tells the officer whether the road ahead is
 * covered.
 *
 * An empty cache is stated outright. Phrasing it as «۰ فرم» instead would read like a
 * measurement, and an officer who believes the forms are downloaded leaves base
 * expecting an organization's form they will not get.
 */
export function describeOfflineFormCache(status: OfflineFormCacheStatus, nowMs: number): string {
  if (status.formCount === 0 && !status.hasProcess) {
    return 'فرمی برای استفاده آفلاین ذخیره نشده';
  }
  const parts = [`${fa(status.formCount)} فرم`];
  if (status.hasProcess) parts.push('۱ فرآیند');
  const stored = parts.join(' و ');
  if (!status.fetchedAt) {
    return `${stored} ذخیره شده`;
  }
  const age = describeCacheAge(status.fetchedAt, nowMs);
  return age ? `${stored} ذخیره شده · ${age}` : `${stored} ذخیره شده`;
}

// ---------------------------------------------------------------------------
// Reconciling a completed download against what is already stored
// ---------------------------------------------------------------------------

/**
 * The stored keys a finished download should drop.
 *
 * The download is authoritative: a form the organization no longer publishes is
 * removed, because leaving it cached keeps a retired workflow fillable offline.
 *
 * The caller only reaches this on a run that fetched every form successfully — a
 * dropped connection part-way through must leave the cache untouched rather than
 * prune forms it never managed to ask about.
 */
export function staleKeysToRemove(
  existing: readonly OfflineFormEntry[],
  scope: OfflineFormScope,
  incomingKeys: readonly string[],
): string[] {
  const keep = new Set(incomingKeys);
  return existing
    .filter(entry => entry.scope === scope && !keep.has(entry.form_key))
    .map(entry => entry.form_key);
}

/**
 * The forms a download actually moved, by display name.
 *
 * Only genuine version changes are reported. A refresh that returned the same
 * versions has nothing to announce, and a toast claiming everything was «updated»
 * every time an officer pressed the button would train them to ignore it.
 */
export function changedFormNames(
  previous: readonly OfflineFormEntry[],
  incoming: readonly OfflineFormEntry[],
): string[] {
  const before = new Map(previous.map(entry => [`${entry.scope}:${entry.form_key}`, entry.version]));
  const names: string[] = [];
  for (const entry of incoming) {
    const key = `${entry.scope}:${entry.form_key}`;
    const previousVersion = before.get(key);
    if (previousVersion !== entry.version) {
      names.push(entry.name);
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// Whether the control belongs on the org card
// ---------------------------------------------------------------------------

export type OrgFormsAvailability = {
  /** `false` means the control is not rendered at all. */
  visible: boolean;
  enabled: boolean;
  /** Persian text explaining a disabled control; `null` when it is usable. */
  reason: string | null;
};

/**
 * Whether the org card offers the download, and whether it is usable.
 *
 * The distinction between hidden and disabled is the point. A control that cannot
 * work because there is nothing to scope it to, or because the module the forms live
 * behind is switched off for this organization, would only ever report a failure the
 * officer cannot act on — so it is not drawn. A control that cannot work right now
 * because the officer is out of coverage stays drawn and disabled, because it will
 * work the moment they do, and naming the reason beats leaving them guessing.
 */
export function orgFormsAvailability(inputs: {
  hasOrganization: boolean;
  moduleEnabled: boolean;
  offline: boolean;
}): OrgFormsAvailability {
  if (!inputs.hasOrganization || !inputs.moduleEnabled) {
    return { visible: false, enabled: false, reason: null };
  }
  if (inputs.offline) {
    return { visible: true, enabled: false, reason: 'برای دریافت فرم‌ها اتصال اینترنت لازم است' };
  }
  return { visible: true, enabled: true, reason: null };
}

/** Persian digits, as the rest of the app's numerals. */
function fa(value: number): string {
  return Math.round(value).toLocaleString('fa-IR');
}