import type { AccidentDraft, IncidentType } from './types';

export const INCIDENT_TYPE_KEYS: readonly IncidentType[] = [
  'accident',
  'road_breakdown',
  'road_obstacle',
  'other',
];

/** The three non-accident report kinds share the lightweight per-type flow. */
export const NON_ACCIDENT_TYPES: readonly IncidentType[] = [
  'road_breakdown',
  'road_obstacle',
  'other',
];

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  accident: 'تصادف',
  road_breakdown: 'خرابی راه',
  road_obstacle: 'مانع یا خطر در مسیر',
  other: 'سایر رخدادها',
};

/** Compact label used in list rows and report cards. */
export const INCIDENT_TYPE_SHORT_LABEL: Record<IncidentType, string> = {
  accident: 'تصادف',
  road_breakdown: 'خرابی',
  road_obstacle: 'مانع یا خطر',
  other: 'سایر',
};

/** Server `report_id` prefix per type (`REP-`/`BRK-`/`OBS-`/`OTH-`). */
export const INCIDENT_TYPE_REPORT_PREFIX: Record<IncidentType, string> = {
  accident: 'REP',
  road_breakdown: 'BRK',
  road_obstacle: 'OBS',
  other: 'OTH',
};

/**
 * Server-rejected accident-only fields. Non-accident reports must never emit
 * the vehicle/people/facility DTO arrays nor the accident severity/collision
 * relations (`typeId`/`collisionTypeId`).
 */
export const ACCIDENT_ONLY_DATA_KEYS: readonly string[] = [
  'vehicle_dtos',
  'passenger_dtos',
  'pedestrian_dtos',
  'people_dtos',
  'facility_damage_dtos',
  'collisionTypeId',
  'typeId',
];

export function isIncidentType(value: unknown): value is IncidentType {
  return typeof value === 'string' && (INCIDENT_TYPE_KEYS as readonly string[]).includes(value);
}

/** Normalizes an unknown/absent server or draft value to a concrete type. */
export function normalizeIncidentType(value: unknown): IncidentType {
  return isIncidentType(value) ? value : 'accident';
}

/** Normalizes a possibly-missing legacy draft type to `accident`. */
export function incidentTypeOf(draft: Pick<AccidentDraft, 'incident_type'>): IncidentType {
  return isIncidentType(draft.incident_type) ? draft.incident_type : 'accident';
}

export function isNonAccidentType(type: IncidentType): boolean {
  return type !== 'accident';
}
