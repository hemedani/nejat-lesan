import type { BackendActRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { IncidentType, Session } from '@/domain/types';

export type ProcessQuestionTarget =
  | { kind: 'relation'; path: string }
  | { kind: 'dto'; dto: string; field: string }
  | { kind: 'dynamic' };

export type ProcessOption = { _id: string; name: string };

export type ProcessQuestion = {
  key: string;
  question: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  required: boolean;
  /** Backend question-registry model name (`dynamic` = free text). */
  model_name: string;
  allowed_answer_ids?: string[];
  multi_select: boolean;
  target: ProcessQuestionTarget;
  /** Resolved by `getForPatrol` when `answers: 1` (whitelist only). */
  answers?: ProcessOption[];
};

export type ProcessStep = {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  required: boolean;
  questions: ProcessQuestion[];
};

export type PatrolProcess = {
  _id: string;
  name: string;
  description?: string;
  status: string;
  version: number;
  incident_type?: IncidentType;
  steps: ProcessStep[];
};

export type PatrolProcessResult = {
  process: PatrolProcess | null;
};

type GetForPatrolRequest = BackendActRequest<'main', 'accident_process', 'getForPatrol'>;

/**
 * The patrol wizard endpoint. `{ process: null }` means the officer's org has
 * no active process for the type (built-in flows are the fallback); the
 * no-membership/module-off errors surface through the standard translator.
 */
export function fetchPatrolProcess(
  session: Session,
  incidentType: IncidentType | undefined,
  options: ApiRequestOptions = {},
): Promise<PatrolProcessResult> {
  return callTypedAct<'main', 'accident_process', 'getForPatrol', PatrolProcessResult>(
    {
      service: 'main',
      model: 'accident_process',
      act: 'getForPatrol',
      details: {
        set: {
          ...(incidentType ? { incidentType } : {}),
        },
        get: { process: 1, answers: 1 },
      },
    } as unknown as GetForPatrolRequest,
    { token: session.token, ...options },
  );
}
