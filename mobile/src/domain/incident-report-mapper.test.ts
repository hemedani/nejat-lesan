import { describe, expect, it } from 'vitest';

import type { AccidentDraft } from '@/domain/types';

import { buildIncidentReportAddSet } from './accident-mapper';

const makeDraft = (data: Record<string, unknown>): AccidentDraft => ({
  client_report_uuid: 'uuid-ir',
  incident_type: 'road_breakdown',
  data,
  gps_coords: { latitude: 35.7, longitude: 51.4 },
  incident_coords: { latitude: 35.71, longitude: 51.41 },
  schema_version: 1,
  sync_status: 'queued',
  updated_at: '2026-10-02T10:00:00.000Z',
});

describe('buildIncidentReportAddSet', () => {
  it('refuses a draft with no form, because the report belongs to one', () => {
    const result = buildIncidentReportAddSet(makeDraft({}));
    expect(result.ok).toBe(false);
  });

  it('falls back to the officer GPS when no point was selected', () => {
    // Same rule as the accident mapper: a chosen point wins, the officer's own fix
    // is the fallback, so a report is never lost to a missing pin.
    const draft = {
      ...makeDraft({ form_definition_id: 'fd-1' }),
      incident_coords: undefined,
    } as AccidentDraft;
    const result = buildIncidentReportAddSet(draft);
    expect(result.ok).toBe(true);
    expect(result.ok && (result.set as Record<string, unknown>)['location']).toBeDefined();
  });

  it('refuses a draft with neither a selected point nor a GPS fix', () => {
    const draft = {
      ...makeDraft({ form_definition_id: 'fd-1' }),
      incident_coords: undefined,
      gps_coords: undefined,
    } as AccidentDraft;
    const result = buildIncidentReportAddSet(draft);
    expect(result.ok).toBe(false);
  });

  it('names the form the report was filed under', () => {
    const result = buildIncidentReportAddSet(
      makeDraft({ form_definition_id: 'fd-1', location: {} }),
    );
    expect(result.ok).toBe(true);
    expect(result.ok && (result.set as Record<string, unknown>)['form_definition_id']).toBe('fd-1');
  });

  it('never sends accident-only keys', () => {
    // The split exists so a non-accident report cannot contaminate accident data,
    // and `incident_report` does not declare vehicle cards or collision type.
    const result = buildIncidentReportAddSet(
      makeDraft({
        form_definition_id: 'fd-1',
        vehicle_dtos: [{ plaque_no: [] }],
        people_dtos: [{ name: 'x' }],
        collisionTypeId: '6510aaaa',
        typeId: '6510bbbb',
        incident_payload: { description: 'legacy' },
        incident_type: 'road_breakdown',
      }),
    );

    const set = (result.ok ? result.set : {}) as Record<string, unknown>;
    for (const key of [
      'vehicle_dtos',
      'pedestrian_dtos',
      'people_dtos',
      'facility_damage_dtos',
      'collisionTypeId',
      'typeId',
      'incident_payload',
      'incident_type',
    ]) {
      expect(set).not.toHaveProperty(key);
    }
  });

  it('promotes the form description to a real column', () => {
    const result = buildIncidentReportAddSet(
      makeDraft({ form_definition_id: 'fd-1', description: '  سطح راه خراب است  ' }),
    );
    const set = (result.ok ? result.set : {}) as Record<string, unknown>;
    expect(set['description']).toBe('سطح راه خراب است');
  });

  it('keeps the form answer tree and version for reopening a returned report', () => {
    const result = buildIncidentReportAddSet(
      makeDraft({
        form_definition_id: 'fd-1',
        form_answers: { severity: 'low', vehicles: [{ plate: '۱۱ ب ۲۲۲' }] },
        form_version: 3,
        dynamic_answers: [{ model_name: 'road_defect', answer_ids: ['d1'] }],
      }),
    );
    const set = (result.ok ? result.set : {}) as Record<string, unknown>;
    expect(set['form_answers']).toEqual({
      severity: 'low',
      vehicles: [{ plate: '۱۱ ب ۲۲۲' }],
    });
    expect(set['form_version']).toBe(3);
    expect(set['dynamic_answers']).toHaveLength(1);
  });

  it('carries the bindable relations and drops empty ones', () => {
    const result = buildIncidentReportAddSet(
      makeDraft({
        form_definition_id: 'fd-1',
        roadDefectsIds: ['d1', 'd2', ''],
        equipmentDamagesIds: [],
        incidentSeverityId: 's1',
      }),
    );
    const set = (result.ok ? result.set : {}) as Record<string, unknown>;
    expect(set['roadDefectsIds']).toEqual(['d1', 'd2']);
    expect(set).not.toHaveProperty('equipmentDamagesIds');
    expect(set['incidentSeverityId']).toBe('s1');
  });

  it('records the sync state so the control centre sees it as queued', () => {
    const result = buildIncidentReportAddSet(makeDraft({ form_definition_id: 'fd-1' }));
    expect(result.ok && (result.set as Record<string, unknown>)['sync_status']).toBe('queued');

    const draft = buildIncidentReportAddSet({
      ...makeDraft({ form_definition_id: 'fd-1' }),
      sync_status: 'draft',
    });
    expect(draft.ok && (draft.set as Record<string, unknown>)['sync_status']).toBe('draft');
  });

  it('stamps the submitting app build so the backend can link the organization', () => {
    const result = buildIncidentReportAddSet(makeDraft({ form_definition_id: 'fd-1' }), {
      app_version: '1.4.2',
      platform: 'ios',
    });
    const set = (result.ok ? result.set : {}) as Record<string, unknown>;
    expect(set['submitted_from']).toEqual({ app_version: '1.4.2', platform: 'ios' });
  });

  it('omits provenance when the caller does not know the version', () => {
    // A report must never claim a build we cannot vouch for, and the absence is
    // also what marks it as not-an-app-submission.
    const unknown = buildIncidentReportAddSet(makeDraft({ form_definition_id: 'fd-1' }), null);
    expect(unknown.ok && (unknown.set as Record<string, unknown>)['submitted_from']).toBeUndefined();

    const absent = buildIncidentReportAddSet(makeDraft({ form_definition_id: 'fd-1' }));
    expect(absent.ok && (absent.set as Record<string, unknown>)['submitted_from']).toBeUndefined();
  });
});
