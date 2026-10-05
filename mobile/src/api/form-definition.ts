import type { AnswerTree, FormDefinition } from '@forms';
import { callTypedAct } from './client';
import type {
  BackendActRequest,
} from './backend-types';
import type { ApiRequestOptions } from './client';
import type { FormKind, PickerForm } from '@/domain/form-picker';
import type { Session } from '@/domain/types';

/** `{ _id, name }` option rows for a reference field's source model. */
export type ReferenceOption = {
  _id: string;
  name: string;
};

export type PatrolForm = {
  _id: string;
  name: string;
  description?: string;
  /**
   * `form_kind`, not the retired `incident_type`: the definition was renamed when
   * the report model split, and `getForPatrol` returns `form_kind`. The report is
   * classified by its form, so this is what tells the caller which model will
   * receive the answers.
   */
  form_kind?: FormKind;
  schema_version: number;
  definition: FormDefinition;
};

export type PatrolFormResult = {
  form: PatrolForm | null;
  /**
   * Resolved options per reference model.
   *
   * The backend resolves these because a narrowed option list cannot be computed
   * on a device that may be offline and cannot enumerate a reference model.
   */
  options: Record<string, ReferenceOption[]>;
  version: { version: number };
};

/**
 * `get` is a want-marker (`enums([0, 1])` on the backend), not a projection:
 * the act returns its whole payload and the framework never narrows it.
 *
 * The values are the idiomatic `1` every Lesan client sends — the validators
 * were the outliers and used to declare the *response* type here instead, which
 * rejected this payload with "Expected an object, but received: 1".
 */
const PATROL_FORM_GET = { form: 1, options: 1, version: 1 } as const;

/**
 * Fetch the org's active form definition plus its reference options.
 *
 * `{ form: null }` means the org has published no form for this incident type,
 * in which case the caller falls back to the built-in flows — it is not an
 * error.
 */
export function fetchPatrolForm(
  session: Session,
  formKind: FormKind | undefined,
  options: ApiRequestOptions = {},
): Promise<PatrolFormResult> {
  return callTypedAct<'main', 'form_definition', 'getForPatrol', PatrolFormResult>(
    {
      service: 'main',
      model: 'form_definition',
      act: 'getForPatrol',
      details: {
        set: {
          ...(formKind ? { formKind } : {}),
        },
        get: PATROL_FORM_GET,
      },
    },
    { token: session.token, ...options },
  );
}

/**
 * Fetch one specific definition by id.
 *
 * The entry screen lets the officer pick a form, and the id they picked has to
 * survive the navigation — asking `getForPatrol` for "the active accident form"
 * instead would silently swap in a different form if the organization activated
 * another one in between. `definitionId` is resolved without the `status:
 * active` filter, so a form that was just archived still opens.
 */
export function fetchPatrolFormById(
  session: Session,
  definitionId: string,
  options: ApiRequestOptions = {},
): Promise<PatrolFormResult> {
  return callTypedAct<'main', 'form_definition', 'getForPatrol', PatrolFormResult>(
    {
      service: 'main',
      model: 'form_definition',
      act: 'getForPatrol',
      details: {
        set: { definitionId },
        get: PATROL_FORM_GET,
      },
    },
    { token: session.token, ...options },
  );
}

/**
 * The organization's active forms, for the entry screen's picker.
 *
 * A separate list act from `getForPatrol`, because the entry screen has to show
 * *many* forms at once — the officer chooses one — while `getForPatrol` resolves
 * the single form for a report already in progress.
 *
 * `gets` filters on `form_kind` (the act's own snake_case key), and `callTypedAct`
 * has already unwrapped the `{ success, body }` envelope, so the resolved value
 * *is* the row array — reading `.body` off it would find nothing.
 */
export async function fetchPatrolForms(
  session: Session,
  formKind?: FormKind,
  options: ApiRequestOptions = {},
): Promise<PickerForm[]> {
  const rows = await callTypedAct<
    'main',
    'form_definition',
    'gets',
    Record<string, unknown>[]
  >(
    {
      service: 'main',
      model: 'form_definition',
      act: 'gets',
      details: {
        set: {
          page: 1,
          limit: 100,
          status: 'active',
          ...(formKind ? { form_kind: formKind } : {}),
        },
        get: {
          _id: 1,
          name: 1,
          description: 1,
          form_kind: 1,
          icon: 1,
        },
      },
    } as unknown as BackendActRequest<'main', 'form_definition', 'gets'>,
    { token: session.token, ...options },
  );
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    _id: String(row._id),
    name: String(row.name ?? ''),
    description: typeof row.description === 'string' ? row.description : undefined,
    form_kind: row.form_kind === 'incident_report' ? 'incident_report' : 'accident',
    icon: typeof row.icon === 'string' ? row.icon : undefined,
  }));
}

/**
 * Ask the backend to re-validate a draft.
 *
 * The device already validated with the same engine, so this is a confirmation
 * rather than the primary loop. It exists because a stale app build must not be
 * able to file a report the current definition forbids.
 */
export function validateFormAnswers(
  session: Session,
  definitionId: string,
  answers: AnswerTree,
  options: ApiRequestOptions = {},
): Promise<unknown> {
  return callTypedAct<'main', 'form_definition', 'validate', unknown>(
    {
      service: 'main',
      model: 'form_definition',
      act: 'validate',
      details: {
        set: { _id: definitionId, answers },
        get: {},
      },
    },
    { token: session.token, ...options },
  );
}