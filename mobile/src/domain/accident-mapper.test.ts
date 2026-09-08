import { describe, expect, it } from 'vitest';

import type { AccidentDraft } from '@/domain/types';
import { buildAccidentAddSet } from './accident-mapper';

function makeDraft(overrides: Partial<AccidentDraft> = {}): AccidentDraft {
  return {
    client_report_uuid: 'uuid-abc',
    data: {},
    gps_coords: { latitude: 35.7, longitude: 51.4 },
    incident_coords: { latitude: 35.71, longitude: 51.41 },
    schema_version: 1,
    sync_status: 'queued',
    updated_at: '2026-08-25T10:00:00.000Z',
    ...overrides,
  };
}

describe('buildAccidentAddSet', () => {
  it('requires a selected incident point', () => {
    const result = buildAccidentAddSet(makeDraft({ gps_coords: undefined, incident_coords: undefined }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('موقعیت');
    }
  });

  it('builds GeoJSON points and keeps officer GPS separate from the incident location', () => {
    const result = buildAccidentAddSet(makeDraft());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.set.location).toEqual({ coordinates: [51.41, 35.71], type: 'Point' });
      expect(result.set.gps_coords).toEqual({ coordinates: [51.4, 35.7], type: 'Point' });
      expect(result.set.client_report_uuid).toBe('uuid-abc');
    }
  });

  it('falls back to the draft timestamp when no accident date was captured', () => {
    const result = buildAccidentAddSet(makeDraft());
    if (result.ok) {
      expect(result.set.date_of_accident).toBe(makeDraft().updated_at);
    }
  });

  it('forwards relation ids only as non-empty strings', () => {
    const result = buildAccidentAddSet(
      makeDraft({
        data: { typeId: 'type-1', collisionTypeId: '', laneId: undefined },
      }),
    );
    if (result.ok) {
      expect(result.set['typeId']).toBe('type-1');
      expect(result.set).not.toHaveProperty('collisionTypeId');
      expect(result.set).not.toHaveProperty('laneId');
    }
  });

  it('sends the selected police station as a relation id, not free text', () => {
    const result = buildAccidentAddSet(
      makeDraft({
        data: {
          policeStationId: 'station-1',
          police_station_name: 'کلانتری ۱۲',
        },
      }),
    );
    if (result.ok) {
      expect(result.set['policeStationId']).toBe('station-1');
      expect(result.set).not.toHaveProperty('police_station_name');
    }
  });

  it('never leaks the local-only severity field into the sync payload', () => {
    const result = buildAccidentAddSet(
      makeDraft({ data: { severity: 'fatal', typeId: 'type-fatal' } }),
    );
    if (result.ok) {
      expect(result.set).not.toHaveProperty('severity');
      expect(result.set['typeId']).toBe('type-fatal');
    }
  });

  it('filters array relations to non-empty string ids', () => {
    const result = buildAccidentAddSet(
      makeDraft({
        data: { airStatusesIds: ['a1', '', 42], roadDefectIds: [] },
      }),
    );
    if (result.ok) {
      expect(result.set['airStatusesIds']).toEqual(['a1']);
      expect(result.set).not.toHaveProperty('roadDefectIds');
    }
  });

  it('passes through nested DTO payloads untouched', () => {
    const vehicleDto = { plaque_no: ['22', '111', ' Iran55'], driver: { national_code: '0012' } };
    const result = buildAccidentAddSet(makeDraft({ data: { vehicle_dtos: [vehicleDto] } }));
    if (result.ok) {
      expect(result.set['vehicle_dtos']).toEqual([vehicleDto]);
    }
  });

  it('defaults a legacy draft (no incident_type) to an accident and omits the field', () => {
    const result = buildAccidentAddSet(makeDraft({ data: { typeId: 'type-1' } }));
    if (result.ok) {
      expect(result.set).not.toHaveProperty('incident_type');
      expect(result.set['typeId']).toBe('type-1');
    }
  });

  it('emits incident_type for an explicitly typed accident', () => {
    const result = buildAccidentAddSet(makeDraft({ incident_type: 'accident' }));
    if (result.ok) {
      expect(result.set['incident_type']).toBe('accident');
    }
  });

  it('serializes a non-accident draft with its payload, severity and reference ids', () => {
    const result = buildAccidentAddSet(
      makeDraft({
        incident_type: 'road_breakdown',
        data: {
          incident_payload: {
            description: 'ترک‌خوردگی سطح آزادراه',
            is_hazard: true,
            needs_repair: true,
          },
          incidentSeverityId: 'sev-2',
          roadDefectsIds: ['defect-1', 'defect-2'],
          equipmentDamagesIds: ['eq-1'],
          laneId: 'lane-3',
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.set['incident_type']).toBe('road_breakdown');
      expect(result.set['incident_payload']).toEqual({
        description: 'ترک‌خوردگی سطح آزادراه',
        is_hazard: true,
        needs_repair: true,
      });
      expect(result.set['incidentSeverityId']).toBe('sev-2');
      expect(result.set['roadDefectsIds']).toEqual(['defect-1', 'defect-2']);
      expect(result.set['equipmentDamagesIds']).toEqual(['eq-1']);
      expect(result.set['laneId']).toBe('lane-3');
    }
  });

  it('never emits accident-only DTO/relation keys for non-accident reports', () => {
    const result = buildAccidentAddSet(
      makeDraft({
        incident_type: 'road_obstacle',
        data: {
          typeId: 'type-fatal',
          collisionTypeId: 'col-1',
          vehicle_dtos: [{ plaque_no: ['1', '2', '3'] }],
          people_dtos: [{ first_name: 'علی' }],
          facility_damage_dtos: [{ asset_group: 'گاردریل' }],
          roadDefectsIds: ['defect-9'],
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const forbidden of [
        'typeId',
        'collisionTypeId',
        'vehicle_dtos',
        'passenger_dtos',
        'pedestrian_dtos',
        'people_dtos',
        'facility_damage_dtos',
      ]) {
        expect(result.set).not.toHaveProperty(forbidden);
      }
      expect(result.set['roadDefectsIds']).toEqual(['defect-9']);
    }
  });

  it('keeps an undefined incident_payload out of non-accident payloads', () => {
    const result = buildAccidentAddSet(makeDraft({ incident_type: 'other' }));
    if (result.ok) {
      expect(result.set).not.toHaveProperty('incident_payload');
      expect(result.set).not.toHaveProperty('incidentSeverityId');
    }
  });

  it('sends incidentSeverityId whenever the data carries it (process-severity)', () => {
    const result = buildAccidentAddSet(
      makeDraft({ data: { incidentSeverityId: 'sev-2', typeId: 'type-1' } }),
    );
    if (result.ok) {
      expect(result.set['incidentSeverityId']).toBe('sev-2');
      expect(result.set['typeId']).toBe('type-1');
    }
  });

  it('forwards process_version and dynamic_answers while ignoring local process_state', () => {
    const result = buildAccidentAddSet(
      makeDraft({
        incident_type: 'road_breakdown',
        data: {
          process_version: 3,
          dynamic_answers: [
            { step_key: 's1', question_key: 'q1', model_name: 'dynamic', value: 'خطرناک' },
          ],
          process_state: { whatever: true },
        },
      }),
    );
    if (result.ok) {
      expect(result.set['process_version']).toBe(3);
      expect(result.set['dynamic_answers']).toEqual([
        { step_key: 's1', question_key: 'q1', model_name: 'dynamic', value: 'خطرناک' },
      ]);
      expect(result.set).not.toHaveProperty('process_state');
    }
  });
});
