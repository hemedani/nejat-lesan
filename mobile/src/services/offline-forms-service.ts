/**
 * The organization's own forms, read from the device and filled from the server.
 *
 * Every screen that needs an org-authored form goes through here, and every screen
 * reads the device first. That is the whole point: an officer on the road has no
 * network, and the alternative — fetching on open — is what used to hand them the
 * bundled default form instead of their own.
 *
 * The network is reached only by `downloadOrgForms`, which the officer asks for from
 * the org card on Home. Nothing else in the app can make the app depend on it.
 */

import { fetchPatrolFormById, fetchPatrolForms, type PatrolFormResult } from '@/api/form-definition';
import { fetchPatrolProcess, type PatrolProcessResult } from '@/api/accident-process';
import type { FormKind, PickerForm } from '@/domain/form-picker';
import type { IncidentType, Session } from '@/domain/types';
import {
  changedFormNames,
  staleKeysToRemove,
  summarizeOfflineForms,
  type OfflineFormCacheStatus,
  type OfflineFormEntry,
} from '@/domain/offline-forms';
import {
  deleteOfflineForms,
  getOfflineForm,
  listOfflineForms,
  saveOfflineForms,
} from '@/storage/local-database';

const FORM_SCOPE = 'form_definition' as const;
const PROCESS_SCOPE = 'accident_process' as const;

export type OrgFormsDownload = {
  formCount: number;
  /** Forms whose version moved on, by name. Empty on an unchanged refresh. */
  changed: string[];
};

/** The stored payload, or `null` when the row cannot be trusted as a usable form. */
function readFormPayload(entry: OfflineFormEntry | null): PatrolFormResult | null {
  const payload = entry?.payload as PatrolFormResult | undefined;
  return payload && typeof payload.form === 'object' && payload.form !== null ? payload : null;
}

function readProcessPayload(entry: OfflineFormEntry | null): PatrolProcessResult | null {
  const payload = entry?.payload as PatrolProcessResult | undefined;
  return payload && typeof payload === 'object' ? payload : null;
}

/**
 * The active version a payload carries.
 *
 * Read from the payload rather than the column so the stale check compares what the
 * backend reported against what the draft recorded, not a value this app wrote.
 */
function versionOf(payload: unknown): number {
  const version = (payload as { version?: { version?: unknown } } | null)?.version?.version;
  return Number(version);
}

/** The entry screen's picker, built from what is on the device. */
export async function loadCachedFormIndex(): Promise<PickerForm[]> {
  const entries = await listOfflineForms(FORM_SCOPE);
  return entries.flatMap(entry => {
    const payload = readFormPayload(entry);
    if (!payload) {
      return [];
    }
    const row: PickerForm = {
      _id: entry.form_key,
      name: payload.form?.name || entry.name,
      form_kind: entry.form_kind,
    };
    if (payload.form?.description) {
      row.description = payload.form.description;
    }
    return [row];
  });
}

/** One authored form by id — the form the officer picked, or a draft's own form. */
export async function loadCachedForm(definitionId: string): Promise<PatrolFormResult | null> {
  return readFormPayload(await getOfflineForm(FORM_SCOPE, definitionId));
}

/**
 * The authored form for a report collection.
 *
 * Used when no id is known yet. The backend guarantees at most one active form per
 * kind per organization, so the first stored row is the answer.
 */
export async function loadCachedFormOfKind(kind: FormKind): Promise<PatrolFormResult | null> {
  const entries = await listOfflineForms(FORM_SCOPE);
  const match = entries.find(entry => (entry.form_kind ?? 'accident') === kind);
  return readFormPayload(match ?? null);
}

/** The legacy org process wizard, stored under the incident type it files. */
export async function loadCachedProcess(incidentType: IncidentType): Promise<PatrolProcessResult | null> {
  return readProcessPayload(await getOfflineForm(PROCESS_SCOPE, incidentType));
}

/** What the org card reports: how much is stored, and how old it is. */
export async function offlineFormCacheStatus(): Promise<OfflineFormCacheStatus> {
  const [forms, processes] = await Promise.all([
    listOfflineForms(FORM_SCOPE),
    listOfflineForms(PROCESS_SCOPE),
  ]);
  return summarizeOfflineForms([...forms, ...processes]);
}

/**
 * One download, or one already in flight.
 *
 * A second caller joins the first rather than starting its own prune pass, which
 * would race the first one's writes and could delete a form it had just stored.
 */
let inFlight: Promise<OrgFormsDownload> | null = null;

export function downloadOrgForms(session: Session): Promise<OrgFormsDownload> {
  inFlight ??= runDownload(session).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runDownload(session: Session): Promise<OrgFormsDownload> {
  const [beforeForms, beforeProcesses] = await Promise.all([
    listOfflineForms(FORM_SCOPE),
    listOfflineForms(PROCESS_SCOPE),
  ]);

  // The list act answers with ids and titles only, so each form is then asked for by
  // id. A failure here aborts before anything is written: see the pruning note below.
  const listed = await fetchPatrolForms(session);
  const entries: OfflineFormEntry[] = [];
  const fetchedAt = new Date().toISOString();

  for (const form of listed) {
    const payload = await fetchPatrolFormById(session, form._id);
    if (!payload?.form) {
      continue;
    }
    entries.push({
      scope: FORM_SCOPE,
      form_key: form._id,
      name: payload.form.name || form.name,
      form_kind: payload.form.form_kind ?? 'accident',
      version: versionOf(payload),
      payload,
      fetched_at: fetchedAt,
    });
  }

  // The two systems are independent. An org that published no wizard, or one this
  // officer's roles cannot resolve, must not cost them the forms they came for.
  //
  // `wizardChecked` is what keeps a failure from being read as a withdrawal: only a
  // run that actually reached the backend may conclude the wizard is gone.
  let wizardChecked = false;
  try {
    const result = await fetchPatrolProcess(session, 'accident');
    wizardChecked = true;
    if (result.process) {
      entries.push({
        scope: PROCESS_SCOPE,
        form_key: 'accident',
        name: result.process.name,
        version: versionOf({ version: { version: result.process.version } }),
        payload: result,
        fetched_at: fetchedAt,
      });
    }
  } catch {
    // Module off, no org membership, transport — the forms above are already good,
    // and the wizard already on the device stays there.
  }

  const changed = changedFormNames([...beforeForms, ...beforeProcesses], entries);

  await saveOfflineForms(entries);

  // Only now, with every listed form fetched, is it safe to treat an absent form as
  // withdrawn. Pruning earlier would let one dropped connection empty a good cache.
  const formScope = entries.filter(entry => entry.scope === FORM_SCOPE);
  await deleteOfflineForms(
    FORM_SCOPE,
    staleKeysToRemove(beforeForms, FORM_SCOPE, formScope.map(entry => entry.form_key)),
  );
  const processScope = entries.filter(entry => entry.scope === PROCESS_SCOPE);
  await deleteOfflineForms(
    PROCESS_SCOPE,
    wizardChecked
      ? staleKeysToRemove(beforeProcesses, PROCESS_SCOPE, processScope.map(entry => entry.form_key))
      : [],
  );

  return { formCount: formScope.length, changed };
}