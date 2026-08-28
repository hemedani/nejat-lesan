import { describe, expect, it } from 'vitest';

import type { AccidentFormState } from './accident-form';
import {
  findTypeOptionForSeverity,
  formToData,
  isValidDatetime,
  readFormState,
  SEVERITY_BY_TYPE_NAME,
  SEVERITY_TYPE_NAMES,
  typeOptionsCoverSeverity,
  validatePhase,
} from './accident-form';

function baseState(overrides: Partial<AccidentFormState> = {}): AccidentFormState {
  return {
    airStatusIds: [],
    collisionTypeId: 'collision-1',
    date_of_accident: '2026-08-25T14:30',
    dead_count: 0,
    facilities: [],
    has_witness: false,
    injured_count: 0,
    lightStatusId: 'light-1',
    people: [],
    police_present: false,
    passengers: [],
    pedestrians: [],
    roadDefectIds: [],
    roadSituationId: 'situation-1',
    roadSurfaceConditionIds: [],
    severity: 'damage',
    typeId: 'type-1',
    vehicles: [],
    ...overrides,
  };
}

const TYPE_OPTIONS = [
  { _id: 't1', name: 'خسارتی' },
  { _id: 't2', name: 'جرحی' },
  { _id: 't3', name: 'فوتی' },
];

describe('severity → type mapping', () => {
  it('exposes the backend type names for every severity', () => {
    expect(SEVERITY_TYPE_NAMES).toEqual({ damage: 'خسارتی', fatal: 'فوتی', injury: 'جرحی' });
    expect(SEVERITY_BY_TYPE_NAME['خسارتی']).toBe('damage');
  });

  it('maps a severity to the matching type document', () => {
    expect(findTypeOptionForSeverity('fatal', TYPE_OPTIONS)?._id).toBe('t3');
    expect(findTypeOptionForSeverity(undefined, TYPE_OPTIONS)).toBeUndefined();
    expect(findTypeOptionForSeverity('fatal', [])).toBeUndefined();
  });

  it('detects whether the loaded type list covers all severities', () => {
    expect(typeOptionsCoverSeverity(TYPE_OPTIONS)).toBe(true);
    expect(typeOptionsCoverSeverity(TYPE_OPTIONS.slice(0, 2))).toBe(false);
    expect(typeOptionsCoverSeverity(undefined)).toBe(false);
  });
});

describe('phase validation', () => {
  it('accepts a complete minimal classification phase', () => {
    const errors = validatePhase('classification', baseState(), { hasSeverityTypeRefs: true });
    expect(errors).toEqual({});
  });

  it('requires severity and collision type', () => {
    const errors = validatePhase(
      'classification',
      baseState({ severity: undefined, typeId: undefined, collisionTypeId: undefined }),
      { hasSeverityTypeRefs: true },
    );
    expect(Object.keys(errors).sort()).toEqual(['collisionTypeId', 'severity', 'typeId']);
  });

  it('keeps offline drafts valid when the type references are unavailable', () => {
    const errors = validatePhase('classification', baseState({ typeId: undefined }), {});
    expect(errors).toEqual({});
  });

  it('enforces the injury/fatal → people conditional rule', () => {
    const injured = validatePhase(
      'people',
      baseState({ severity: 'injury' }),
    );
    expect(injured['people_required']).toBeTruthy();
    const counted = validatePhase(
      'people',
      baseState({ severity: 'fatal', injured_count: 1 }),
    );
    expect(counted).toEqual({});
    const damageOnly = validatePhase('people', baseState({ severity: 'damage' }));
    expect(damageOnly).toEqual({});
  });

  it('requires complete vehicle cards only when cards exist', () => {
    const empty = validatePhase('vehicles', baseState());
    expect(empty).toEqual({});
    const incomplete = validatePhase(
      'vehicles',
      baseState({
        vehicles: [
          {
            driver: { first_name: 'علی' },
            plaque_no: ['22', '111', ''],
          },
        ],
      }),
    );
    expect(Object.keys(incomplete).length).toBeGreaterThan(0);
  });

  it('validates datetime format for basics', () => {
    expect(isValidDatetime('2026-08-25T14:30')).toBe(true);
    expect(isValidDatetime('2026-08-25')).toBe(false);
    expect(isValidDatetime(undefined)).toBe(false);
    const errors = validatePhase('basics', baseState({ date_of_accident: 'nope' }));
    expect(errors['date_of_accident']).toBeTruthy();
  });
});

describe('form state round-trip', () => {
  it('preserves unknown draft data keys on read/write of known fields', () => {
    const state = baseState();
    const data = formToData(state);
    expect(data['severity']).toBe('damage');
    expect(data['typeId']).toBe('type-1');
    expect(data['date_of_accident']).toBe('2026-08-25T14:30');
  });

  it('reads back persisted form payloads', () => {
    const draftData = formToData(baseState());
    const restored = readFormState({
      client_report_uuid: 'u',
      data: draftData,
      schema_version: 1,
      sync_status: 'draft',
      updated_at: '',
    });
    expect(restored.severity).toBe('damage');
    expect(restored.typeId).toBe('type-1');
    expect(restored.vehicles).toEqual([]);
  });

  it('round-trips the police station id and display name', () => {
    const state = baseState({
      police_present: true,
      policeStationId: 'station-1',
      police_station_name: 'کلانتری ۱۲',
    });
    const data = formToData(state);
    expect(data['policeStationId']).toBe('station-1');
    expect(data['police_station_name']).toBe('کلانتری ۱۲');
    const restored = readFormState({
      client_report_uuid: 'u',
      data,
      schema_version: 1,
      sync_status: 'draft',
      updated_at: '',
    });
    expect(restored.policeStationId).toBe('station-1');
    expect(restored.police_station_name).toBe('کلانتری ۱۲');
  });
});
