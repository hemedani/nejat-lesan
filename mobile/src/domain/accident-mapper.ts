import { ACCIDENT_ONLY_DATA_KEYS, isIncidentType } from './incident-type';
import type { AccidentDraft, Coordinates, IncidentType } from './types';

export type AccidentLocation = {
  type: 'Point';
  coordinates: [number, number];
};

export type AccidentAddSet = Record<string, unknown> & {
  location: AccidentLocation;
  date_of_accident: string;
  client_report_uuid: string;
};

export type MapperResult =
  | { ok: true; set: AccidentAddSet }
  | { ok: false; reason: string };

/**
 * The build that filed a report, snapshotted verbatim.
 *
 * Sent only when the running version is actually known: an unknown version must
 * never be reported as a real one, and the *absence* of this object is also what
 * tells the backend the report did not arrive through the app. The backend
 * resolves the filing organization from the session — the client can never name
 * one.
 */
export type SubmissionProvenance = {
  app_version: string;
  platform: 'ios' | 'android';
};

export type IncidentReportAddSet = Record<string, unknown> & {
  location: AccidentLocation;
  client_report_uuid: string;
  form_definition_id: string;
};

export type IncidentReportMapperResult =
  | { ok: true; set: IncidentReportAddSet }
  | { ok: false; reason: string };

function toPoint(coords: Coordinates): AccidentLocation {
  return { type: 'Point', coordinates: [coords.longitude, coords.latitude] };
}

const PASSTHROUGH_TOP_LEVEL_KEYS = [
  'dead_count',
  'has_witness',
  'injured_count',
  'news_number',
  'police_present',
  'police_expert_name',
  'police_arrival_time',
  'officer_cause_description',
  'gps_accuracy',
  'travel_direction',
  'kilometer',
  'meter',
  'vehicle_dtos',
  'passenger_dtos',
  'pedestrian_dtos',
  'people_dtos',
  'facility_damage_dtos',
] as const;

const RELATION_KEYS = [
  'officerId',
  'patrolUnitId',
  'vehicleId',
  'laneId',
  'policeStationId',
  'croquisTypeId',
  'collisionTypeId',
  'provinceId',
  'cityId',
  'roadId',
  'trafficZoneId',
  'cityZoneId',
  'typeId',
  'positionId',
  'rulingTypeId',
  'lightStatusId',
  'roadSituationId',
  'roadRepairTypeId',
  'shoulderStatusId',
  'incidentSeverityId',
] as const;

const ARRAY_RELATION_KEYS = [
  'airStatusesIds',
  'roadDefectsIds',
  'roadSurfaceConditionsIds',
  'humanReasonsIds',
  'vehicleReasonsIds',
  'equipmentDamagesIds',
] as const;

/** Keys skipped entirely when the report is not an accident. */
const FORBIDDEN_KEYS = new Set<string>(ACCIDENT_ONLY_DATA_KEYS);

function isIncidentPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function resolveIncidentType(draft: AccidentDraft): IncidentType | undefined {
  return isIncidentType(draft.incident_type) ? draft.incident_type : undefined;
}

export function buildAccidentAddSet(draft: AccidentDraft): MapperResult {
  const selectedCoords = draft.incident_coords ?? draft.gps_coords;
  if (!selectedCoords) {
    return { ok: false, reason: 'موقعیت حادثه ثبت نشده است؛ ابتدا محل حادثه را مشخص کنید.' };
  }

  const data = draft.data ?? {};
  const rawDate = data['date_of_accident'];
  const dateOfAccident =
    typeof rawDate === 'string' && rawDate.length > 0 ? rawDate : draft.updated_at;

  const incidentType = resolveIncidentType(draft);
  // Absent type = accident (backend default). A report is "non-accident" only
  // when an explicit road_breakdown/road_obstacle/other is present.
  const isAccident = incidentType === undefined || incidentType === 'accident';

  const set: AccidentAddSet = {
    location: toPoint(selectedCoords),
    date_of_accident: dateOfAccident,
    client_report_uuid: draft.client_report_uuid,
    sync_status: draft.sync_status === 'draft' ? 'draft' : 'queued',
  };

  if (incidentType) {
    set['incident_type'] = incidentType;
  }

  if (draft.gps_coords) {
    set['gps_coords'] = toPoint(draft.gps_coords);
  }

  for (const key of PASSTHROUGH_TOP_LEVEL_KEYS) {
    if (key in set) {
      continue;
    }
    if (!isAccident && FORBIDDEN_KEYS.has(key)) {
      continue;
    }
    const value = data[key];
    if (value !== undefined && value !== null) {
      (set as Record<string, unknown>)[key] = value;
    }
  }

  for (const key of RELATION_KEYS) {
    const value = data[key];
    if (typeof value === 'string' && value.length > 0) {
      if (!isAccident && FORBIDDEN_KEYS.has(key)) {
        continue;
      }
      (set as Record<string, unknown>)[key] = value;
    }
  }

  for (const key of ARRAY_RELATION_KEYS) {
    const value = data[key];
    if (Array.isArray(value)) {
      const ids = value.filter((v): v is string => typeof v === 'string' && v.length > 0);
      if (ids.length > 0) {
        (set as Record<string, unknown>)[key] = ids;
      }
    }
  }

  if (!isAccident) {
    // Non-accident evidence/description payload (struct). Severity for
    // non-accidents rides the shared `incidentSeverityId` relation (handled
    // generically above); the accident `typeId` severity is never emitted.
    const payload = data['incident_payload'];
    if (isIncidentPayload(payload)) {
      set['incident_payload'] = payload;
    }
  }

  // Org-process submissions snapshot `process_version` and carry `dynamic_answers`.
  const processVersion = data['process_version'];
  if (typeof processVersion === 'number' || (typeof processVersion === 'string' && processVersion.length > 0)) {
    set['process_version'] = processVersion;
  }
  const dynamicAnswers = data['dynamic_answers'];
  if (Array.isArray(dynamicAnswers) && dynamicAnswers.length > 0) {
    set['dynamic_answers'] = dynamicAnswers;
  }

  return { ok: true, set };
}

// ---------------------------------------------------------------------------
// Non-accident reports (`incident_report`)
// ---------------------------------------------------------------------------

/**
 * Plain columns `incident_report_set_schema` declares that a form can answer.
 * Deliberately an allowlist rather than a copy-everything-except loop: the
 * report model and the accident model overlap, and one shared exclusion list
 * would silently start forwarding accident fields the day a new one is added.
 */
const REPORT_PASSTHROUGH_KEYS = [
  'is_hazard',
  'needs_repair',
  'follow_up_required',
  'temporary_action',
  'gps_accuracy',
  'travel_direction',
  'kilometer',
  'meter',
  'reported_at',
  'occurred_at',
] as const;

/** Single-valued relations `incident_report` accepts. */
const REPORT_RELATION_KEYS = [
  'officerId',
  'patrolUnitId',
  'vehicleId',
  'policeStationId',
  'provinceId',
  'cityId',
  'roadId',
  'trafficZoneId',
  'cityZoneId',
  'positionId',
  'incidentSeverityId',
  'lightStatusId',
  'roadSituationId',
  'shoulderStatusId',
] as const;

/** Multi-valued relations `incident_report` accepts. */
const REPORT_ARRAY_RELATION_KEYS = [
  'roadDefectsIds',
  'equipmentDamagesIds',
  'airStatusesIds',
  'roadSurfaceConditionsIds',
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Build the `incident_report.add` payload for a non-accident report.
 *
 * The split from `buildAccidentAddSet` is the whole point of the second model:
 * `incident_report` declares no vehicle/people/facility cards, no collision type
 * and no `typeId`, so forwarding an accident-shaped draft would be rejected by
 * the server's strict validator. Only keys the report model actually declares
 * are ever emitted, which is also why the two mappers cannot share one key list.
 *
 * A report is *classified by its form*, never by a category enum, so
 * `form_definition_id` is the one thing that cannot be missing.
 */
export function buildIncidentReportAddSet(
  draft: AccidentDraft,
  provenance?: SubmissionProvenance | null,
): IncidentReportMapperResult {
  const data = draft.data ?? {};

  const formDefinitionId = data['form_definition_id'];
  if (typeof formDefinitionId !== 'string' || formDefinitionId.length === 0) {
    return {
      ok: false,
      reason: 'این گزارش به فرمی متصل نیست؛ ابتدا فرم ثبت را انتخاب کنید.',
    };
  }

  // Same rule as the accident mapper: the chosen pin wins, the officer's own fix
  // is the fallback, so a report is never lost to a missing pin.
  const selectedCoords = draft.incident_coords ?? draft.gps_coords;
  if (!selectedCoords) {
    return { ok: false, reason: 'موقعیت رخداد ثبت نشده است؛ ابتدا محل رخداد را مشخص کنید.' };
  }

  const set: IncidentReportAddSet = {
    location: toPoint(selectedCoords),
    client_report_uuid: draft.client_report_uuid,
    form_definition_id: formDefinitionId,
    sync_status: draft.sync_status === 'draft' ? 'draft' : 'queued',
  };

  if (draft.gps_coords) {
    set['gps_coords'] = toPoint(draft.gps_coords);
  }

  // The form's free-text answer is promoted to a real column so the console can
  // search and show it without decoding the answer tree.
  const rawDescription = data['description'];
  if (typeof rawDescription === 'string' && rawDescription.trim().length > 0) {
    set['description'] = rawDescription.trim();
  }

  // The answer tree and the definition version are kept verbatim: a returned
  // report has to be reopenable against the exact questions it answered.
  const formAnswers = data['form_answers'];
  if (isPlainObject(formAnswers)) {
    set['form_answers'] = formAnswers;
  }
  const formVersion = data['form_version'];
  if (typeof formVersion === 'number') {
    set['form_version'] = formVersion;
  }
  const dynamicAnswers = data['dynamic_answers'];
  if (Array.isArray(dynamicAnswers) && dynamicAnswers.length > 0) {
    set['dynamic_answers'] = dynamicAnswers;
  }

  for (const key of REPORT_PASSTHROUGH_KEYS) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      (set as Record<string, unknown>)[key] = value;
    }
  }

  for (const key of REPORT_RELATION_KEYS) {
    const value = data[key];
    if (typeof value === 'string' && value.length > 0) {
      (set as Record<string, unknown>)[key] = value;
    }
  }

  for (const key of REPORT_ARRAY_RELATION_KEYS) {
    const value = data[key];
    if (Array.isArray(value)) {
      const ids = value.filter((v): v is string => typeof v === 'string' && v.length > 0);
      if (ids.length > 0) {
        (set as Record<string, unknown>)[key] = ids;
      }
    }
  }

  if (provenance) {
    set['submitted_from'] = {
      app_version: provenance.app_version,
      platform: provenance.platform,
    };
  }

  return { ok: true, set };
}
