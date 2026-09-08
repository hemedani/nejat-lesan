import type {
  PatrolProcess,
  ProcessQuestion,
  ProcessStep,
  ProcessOption,
} from '@/api/accident-process';
import type { IncidentType } from './types';

export type ProcessAnswerValue = {
  /** Selected option `_id`s (single-select keeps one). */
  optionIds: string[];
  /** Free-text value for `dynamic`-target questions. */
  value?: string;
};

export type ProcessFormState = {
  processId: string;
  processVersion: number;
  incidentType?: IncidentType;
  answers: Record<string, ProcessAnswerValue>;
};

export type DynamicAnswerEntry = {
  step_key?: string;
  question_key?: string;
  model_name: string;
  value?: string;
};

export type ProcessErrors = Record<string, string>;

/** Relation target path → accident `set` key (`road_defects` → `roadDefectsIds`). */
export function relationSetKey(path: string, multi: boolean): string {
  const camel = path.replace(/_([a-z])/g, (_match, char: string) => char.toUpperCase());
  return multi ? `${camel}Ids` : `${camel}Id`;
}

export function optionsOf(question: ProcessQuestion): ProcessOption[] {
  return Array.isArray(question.answers) ? question.answers : [];
}

export function emptyProcessState(process: PatrolProcess): ProcessFormState {
  return {
    processId: process._id,
    processVersion: process.version,
    incidentType: process.incident_type,
    answers: {},
  };
}

function selectedIds(state: ProcessFormState, questionKey: string): string[] {
  return state.answers[questionKey]?.optionIds ?? [];
}

export function isSelected(state: ProcessFormState, questionKey: string, id: string): boolean {
  return selectedIds(state, questionKey).includes(id);
}

export function selectSingle(state: ProcessFormState, questionKey: string, id: string): ProcessFormState {
  return {
    ...state,
    answers: { ...state.answers, [questionKey]: { optionIds: [id] } },
  };
}

export function toggleMulti(state: ProcessFormState, questionKey: string, id: string): ProcessFormState {
  const ids = selectedIds(state, questionKey);
  const next = ids.includes(id) ? ids.filter(v => v !== id) : [...ids, id];
  return { ...state, answers: { ...state.answers, [questionKey]: { optionIds: next } } };
}

export function setDynamicValue(
  state: ProcessFormState,
  questionKey: string,
  value: string,
): ProcessFormState {
  return { ...state, answers: { ...state.answers, [questionKey]: { optionIds: [], value } } };
}

/**
 * The mobile wizard cannot render `dto`-target questions (e.g. vehicle_type →
 * vehicle_dtos[]) — those belong to the built-in accident form. Fall back to
 * the built-in flow when a process contains any.
 */
export function isProcessRenderable(process: PatrolProcess | null | undefined): boolean {
  if (!process) {
    return false;
  }
  return process.steps.every(step =>
    step.questions.every(question => question.target.kind !== 'dto'),
  );
}

/** Persian per-step validation mirrors the process `required` flags. */
export function validateProcessStep(step: ProcessStep, state: ProcessFormState): ProcessErrors {
  const errors: ProcessErrors = {};
  for (const question of step.questions) {
    if (!question.required) {
      continue;
    }
    const answer = state.answers[question.key];
    if (question.target.kind === 'dynamic') {
      if (!answer?.value || answer.value.trim().length === 0) {
        errors[question.key] = 'پاسخ این سؤال الزامی است.';
      }
    } else if (!answer || answer.optionIds.length === 0) {
      errors[question.key] = 'یک گزینه انتخاب کنید.';
    }
  }
  return errors;
}

export function flattenQuestions(process: PatrolProcess): { step: ProcessStep; question: ProcessQuestion }[] {
  const result: { step: ProcessStep; question: ProcessQuestion }[] = [];
  for (const step of process.steps) {
    for (const question of step.questions) {
      result.push({ step, question });
    }
  }
  return result;
}

/**
 * Maps the wizard answers into backend-shaped draft data:
 * - relation-target answers → the existing typed relation ids on `accident`
 *   (e.g. `collisionTypeId`, `roadDefectsIds`, `incidentSeverityId`, `laneId`);
 * - `dynamic` answers → the `dynamic_answers` snapshot array;
 * - always snapshots `process_version`.
 * The full state is also persisted under `process_state` for offline resumability
 * (the sync mapper ignores that key).
 */
export function processStateToData(
  state: ProcessFormState,
  process: PatrolProcess,
): Record<string, unknown> {
  const data: Record<string, unknown> = { process_version: state.processVersion };
  const dynamics: DynamicAnswerEntry[] = [];

  for (const { step, question } of flattenQuestions(process)) {
    const answer = state.answers[question.key];
    if (!answer) {
      continue;
    }
    if (question.target.kind === 'dynamic') {
      if (answer.value != null && answer.value.trim().length > 0) {
        dynamics.push({
          step_key: step.key,
          question_key: question.key,
          model_name: question.model_name || 'dynamic',
          value: answer.value.trim(),
        });
      }
      continue;
    }
    if (question.target.kind !== 'relation') {
      continue;
    }
    if (answer.optionIds.length === 0) {
      continue;
    }
    const key = relationSetKey(question.target.path, question.multi_select);
    data[key] = question.multi_select ? answer.optionIds : answer.optionIds[0];
  }

  if (dynamics.length > 0) {
    data['dynamic_answers'] = dynamics;
  }
  data['process_state'] = state;
  return data;
}

/**
 * Rebuilds the wizard state from persisted draft data so an officer can resume
 * (or an already-process-submitted draft can be edited). Falls back to reading
 * the typed relation keys and `dynamic_answers` for older drafts.
 */
export function processDataToState(process: PatrolProcess, data: Record<string, unknown>): ProcessFormState {
  const stored = data['process_state'];
  if (stored && typeof stored === 'object') {
    const parsed = stored as ProcessFormState;
    if (parsed.answers && typeof parsed.answers === 'object') {
      return {
        processId: process._id,
        processVersion: typeof parsed.processVersion === 'number' ? parsed.processVersion : process.version,
        incidentType: process.incident_type,
        answers: parsed.answers,
      };
    }
  }

  const answers: Record<string, ProcessAnswerValue> = {};
  const dynamicRows = Array.isArray(data['dynamic_answers']) ? data['dynamic_answers'] : [];
  for (const row of dynamicRows as DynamicAnswerEntry[]) {
    if (row.question_key && typeof row.value === 'string') {
      answers[row.question_key] = { optionIds: [], value: row.value };
    }
  }
  for (const { question } of flattenQuestions(process)) {
    if (question.target.kind !== 'relation') {
      continue;
    }
    const key = relationSetKey(question.target.path, question.multi_select);
    const raw = data[key];
    if (Array.isArray(raw)) {
      answers[question.key] = {
        optionIds: raw.filter((v): v is string => typeof v === 'string'),
      };
    } else if (typeof raw === 'string') {
      answers[question.key] = { optionIds: [raw] };
    }
  }
  return { processId: process._id, processVersion: process.version, incidentType: process.incident_type, answers };
}
