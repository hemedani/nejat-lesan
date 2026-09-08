import { describe, expect, it } from 'vitest';

import type { AccidentDraft } from '@/domain/types';
import {
  readSimpleFormState,
  simpleFormToData,
  validateSimpleForm,
  type SimpleIncidentFormState,
} from './simple-incident-form';

function makeDraft(data: Record<string, unknown> = {}): AccidentDraft {
  return {
    client_report_uuid: 'uuid-abc',
    data,
    incident_type: 'road_breakdown',
    incident_coords: { latitude: 35.7, longitude: 51.4 },
    schema_version: 1,
    sync_status: 'queued',
    updated_at: '2026-09-07T08:00:00.000Z',
  };
}

function baseState(overrides: Partial<SimpleIncidentFormState> = {}): SimpleIncidentFormState {
  return {
    description: '',
    equipmentDamageIds: [],
    roadDefectIds: [],
    temporary_action: '',
    ...overrides,
  };
}

describe('readSimpleFormState', () => {
  it('rebuilds state from backend-shaped draft data', () => {
    const draft = makeDraft({
      incident_payload: {
        description: 'ترک‌خوردگی سطح',
        is_hazard: true,
        needs_repair: false,
        follow_up_required: true,
        temporary_action: 'مسدود شد',
      },
      incidentSeverityId: 'sev-3',
      roadDefectsIds: ['d1', 'd2'],
      equipmentDamagesIds: ['e1'],
      positionId: 'p9',
    });
    expect(readSimpleFormState(draft)).toEqual({
      description: 'ترک‌خوردگی سطح',
      equipmentDamageIds: ['e1'],
      follow_up_required: true,
      incidentSeverityId: 'sev-3',
      is_hazard: true,
      needs_repair: false,
      positionId: 'p9',
      roadDefectIds: ['d1', 'd2'],
      temporary_action: 'مسدود شد',
    });
  });

  it('normalizes missing payload to empty state', () => {
    expect(readSimpleFormState(makeDraft({ roadDefectsIds: ['d1'] }))).toMatchObject({
      description: '',
      is_hazard: undefined,
      temporary_action: '',
    });
  });
});

describe('simpleFormToData', () => {
  it('emits the incident_payload only when a field is set', () => {
    expect(simpleFormToData(baseState())['incident_payload']).toBeUndefined();
    const data = simpleFormToData(baseState({ description: 'آبگرفتگی', is_hazard: true }));
    expect(data['incident_payload']).toEqual({ description: 'آبگرفتگی', is_hazard: true });
  });

  it('always rewrites array relations (empty clears leftovers) and keeps severity', () => {
    const data = simpleFormToData(
      baseState({ roadDefectIds: ['d1'], incidentSeverityId: 'sev-1', positionId: 'p1' }),
    );
    expect(data['roadDefectsIds']).toEqual(['d1']);
    expect(data['equipmentDamagesIds']).toEqual([]);
    expect(data['incidentSeverityId']).toBe('sev-1');
    expect(data['positionId']).toBe('p1');
  });
});

describe('validateSimpleForm', () => {
  it('requires a description or a road defect or equipment damage', () => {
    expect(validateSimpleForm(baseState())['evidence']).toBeTruthy();
    expect(validateSimpleForm(baseState({ description: 'نقص روسازی' }))['evidence']).toBeUndefined();
    expect(validateSimpleForm(baseState({ roadDefectIds: ['d1'] }))['evidence']).toBeUndefined();
    expect(validateSimpleForm(baseState({ equipmentDamageIds: ['e1'] }))['evidence']).toBeUndefined();
  });
});
