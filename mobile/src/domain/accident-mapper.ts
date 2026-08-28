import type { AccidentDraft, Coordinates } from './types';

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
] as const;

const ARRAY_RELATION_KEYS = [
  'airStatusesIds',
  'roadDefectsIds',
  'roadSurfaceConditionsIds',
  'humanReasonsIds',
  'vehicleReasonsIds',
  'equipmentDamagesIds',
] as const;

export function buildAccidentAddSet(draft: AccidentDraft): MapperResult {
  const selectedCoords = draft.incident_coords ?? draft.gps_coords;
  if (!selectedCoords) {
    return { ok: false, reason: 'موقعیت حادثه ثبت نشده است؛ ابتدا محل حادثه را مشخص کنید.' };
  }

  const data = draft.data ?? {};
  const rawDate = data['date_of_accident'];
  const dateOfAccident =
    typeof rawDate === 'string' && rawDate.length > 0 ? rawDate : draft.updated_at;

  const set: AccidentAddSet = {
    location: toPoint(selectedCoords),
    date_of_accident: dateOfAccident,
    client_report_uuid: draft.client_report_uuid,
    sync_status: draft.sync_status === 'draft' ? 'draft' : 'queued',
  };

  if (draft.gps_coords) {
    set['gps_coords'] = toPoint(draft.gps_coords);
  }

  for (const key of PASSTHROUGH_TOP_LEVEL_KEYS) {
    if (key in set) {
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

  return { ok: true, set };
}
