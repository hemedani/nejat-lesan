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
});
