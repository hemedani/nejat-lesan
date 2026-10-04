import type { AnswerTree, FormDefinition } from '@forms';
import { callTypedAct } from './client';
import type {
  BackendActRequest,
} from './backend-types';
import type { ApiRequestOptions } from './client';
import type { PickerForm } from '@/domain/form-picker';
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
  incident_type?: string;
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

type GetForPatrolRequest = BackendActRequest<'main', 'form_definition', 'getForPatrol'>;
type ValidateRequest = BackendActRequest<'main', 'form_definition', 'validate'>;

/**
 * Fetch the org's active form definition plus its reference options.
 *
 * `{ form: null }` means the org has published no form for this incident type,
 * in which case the caller falls back to the built-in flows — it is not an
 * error.
 */
export function fetchPatrolForm(
  session: Session,
  formKind: 'accident' | 'incident_report' | undefined,
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
        get: { form: 1, options: 1, version: 1 },
      },
    } as unknown as GetForPatrolRequest,
    { token: session.token, ...options },
  );
}

/**
 * The organization's active forms, for the entry screen's picker.
 *
 * A separate list act from `getForPatrol`, because the entry screen has to show
 * *many* forms at once — the officer chooses one — while `getForPatrol` resolves
 * the single form for a report already in progress.
 */
export async function fetchPatrolForms(
  session: Session,
  formKind: 'accident' | 'incident_report' | undefined,
  options: ApiRequestOptions = {},
): Promise<PickerForm[]> {
  const response = await callTypedAct<
    'main',
    'form_definition',
    'gets',
    Array<Record<string, unknown>>
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
          ...(formKind ? { formKind } : {}),
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
  const value = response as unknown as {
    success?: boolean;
    body?: Array<Record<string, unknown>>;
  };
  if (!value?.success || !Array.isArray(value.body)) return [];
  return value.body.map((row) => ({
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
    } as unknown as ValidateRequest,
    { token: session.token, ...options },
  );
}