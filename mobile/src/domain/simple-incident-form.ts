import type { AccidentDraft } from './types';

export type SimpleIncidentPayload = {
  description?: string;
  is_hazard?: boolean;
  needs_repair?: boolean;
  temporary_action?: string;
  follow_up_required?: boolean;
};

/**
 * Lightweight capture state for the non-accident report kinds
 * (road_breakdown / road_obstacle / other). These reports never touch the
 * accident-only DTO arrays or the accident severity/collision relations.
 */
export type SimpleIncidentFormState = {
  description: string;
  is_hazard?: boolean;
  needs_repair?: boolean;
  follow_up_required?: boolean;
  temporary_action: string;
  /** Shared `incident_severity` relation (کم/متوسط/زیاد/بحرانی). */
  incidentSeverityId?: string;
  roadDefectIds: string[];
  equipmentDamageIds: string[];
  /** Road position/lane context (position → lane on the backend). */
  positionId?: string;
};

export type SimpleIncidentErrors = Record<string, string>;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asIdList(source: Record<string, unknown>, key: string): string[] {
  const raw = source[key];
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
}

export function readSimpleFormState(draft: AccidentDraft): SimpleIncidentFormState {
  const data = draft.data ?? {};
  const payload = (
    data['incident_payload'] && typeof data['incident_payload'] === 'object'
      ? data['incident_payload']
      : {}
  ) as Record<string, unknown>;

  return {
    description: asString(payload['description']),
    is_hazard: asBool(payload['is_hazard']),
    needs_repair: asBool(payload['needs_repair']),
    follow_up_required: asBool(payload['follow_up_required']),
    temporary_action: asString(payload['temporary_action']),
    incidentSeverityId: asString(data['incidentSeverityId']) || undefined,
    roadDefectIds: asIdList(data, 'roadDefectsIds'),
    equipmentDamageIds: asIdList(data, 'equipmentDamagesIds'),
    positionId: asString(data['positionId']) || undefined,
  };
}

/**
 * Persists backend-shaped keys inside the draft `data`: the `incident_payload`
 * struct is emitted only when at least one field is set; the array relations
 * are always rewritten (empty clears leftovers) so the sync mapper emits them
 * only when non-empty.
 */
export function simpleFormToData(state: SimpleIncidentFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const description = state.description.trim();
  if (description.length > 0) {
    payload['description'] = description;
  }
  if (state.is_hazard !== undefined) {
    payload['is_hazard'] = state.is_hazard;
  }
  if (state.needs_repair !== undefined) {
    payload['needs_repair'] = state.needs_repair;
  }
  if (state.follow_up_required !== undefined) {
    payload['follow_up_required'] = state.follow_up_required;
  }
  if (state.temporary_action.trim().length > 0) {
    payload['temporary_action'] = state.temporary_action.trim();
  }

  const data: Record<string, unknown> = {
    roadDefectsIds: state.roadDefectIds,
    equipmentDamagesIds: state.equipmentDamageIds,
  };
  if (Object.keys(payload).length > 0) {
    data['incident_payload'] = payload;
  } else {
    data['incident_payload'] = undefined;
  }
  if (state.incidentSeverityId) {
    data['incidentSeverityId'] = state.incidentSeverityId;
  }
  if (state.positionId) {
    data['positionId'] = state.positionId;
  }
  return data;
}

/**
 * Mirrors the backend per-type validation: a non-accident report needs a
 * description, at least one road defect, or at least one equipment damage
 * (the incident location is enforced separately by the capture screen).
 */
export function validateSimpleForm(state: SimpleIncidentFormState): SimpleIncidentErrors {
  const errors: SimpleIncidentErrors = {};
  const hasEvidence =
    state.description.trim().length > 0 ||
    state.roadDefectIds.length > 0 ||
    state.equipmentDamageIds.length > 0;
  if (!hasEvidence) {
    errors['evidence'] =
      'برای ثبت این رخداد، شرح آن یا حداقل یک نقص راه / خسارت تجهیزات را وارد کنید.';
  }
  return errors;
}
