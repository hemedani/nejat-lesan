import { describe, expect, it } from 'vitest';

import type { PatrolProcess } from '@/api/accident-process';
import {
  emptyProcessState,
  flattenQuestions,
  isProcessRenderable,
  processDataToState,
  processStateToData,
  relationSetKey,
  selectSingle,
  setDynamicValue,
  toggleMulti,
  validateProcessStep,
} from './process-form';

function processFixture(overrides: Partial<PatrolProcess> = {}): PatrolProcess {
  return {
    _id: 'proc-1',
    name: 'فرآیند آزادراه قم',
    status: 'active',
    version: 2,
    steps: [
      {
        key: 's1',
        title: 'اطلاعات',
        order: 1,
        required: false,
        questions: [
          {
            key: 'q-severity',
            question: 'شدت رخداد',
            order: 1,
            required: true,
            model_name: 'incident_severity',
            multi_select: false,
            target: { kind: 'relation', path: 'incident_severity' },
            answers: [
              { _id: 'sev1', name: 'کم' },
              { _id: 'sev2', name: 'متوسط' },
            ],
          },
          {
            key: 'q-defects',
            question: 'نواقص راه',
            order: 2,
            required: false,
            model_name: 'road_defect',
            multi_select: true,
            target: { kind: 'relation', path: 'road_defects' },
            answers: [{ _id: 'd1', name: 'ترک' }],
          },
          {
            key: 'q-note',
            question: 'توضیح تکمیلی',
            order: 3,
            required: false,
            model_name: 'dynamic',
            multi_select: false,
            target: { kind: 'dynamic' },
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('relationSetKey', () => {
  it('converts relation paths to accident set keys', () => {
    expect(relationSetKey('incident_severity', false)).toBe('incidentSeverityId');
    expect(relationSetKey('road_defects', true)).toBe('roadDefectsIds');
    expect(relationSetKey('collision_type', false)).toBe('collisionTypeId');
    expect(relationSetKey('lane', false)).toBe('laneId');
  });
});

describe('isProcessRenderable', () => {
  it('rejects processes containing dto-target questions', () => {
    const process = processFixture();
    process.steps[0].questions.push({
      key: 'q-veh',
      question: 'نوع وسیله',
      order: 4,
      required: false,
      model_name: 'vehicle_type',
      multi_select: false,
      target: { kind: 'dto', dto: 'vehicle_dtos', field: 'vehicle_type' },
    });
    expect(isProcessRenderable(process)).toBe(false);
    expect(isProcessRenderable(processFixture())).toBe(true);
    expect(isProcessRenderable(null)).toBe(false);
  });
});

describe('validateProcessStep', () => {
  it('flags unanswered required questions with Persian messages', () => {
    const process = processFixture();
    const step = process.steps[0];
    const empty = emptyProcessState(process);
    expect(validateProcessStep(step, empty)['q-severity']).toBeTruthy();
    expect(validateProcessStep(step, empty)['q-defects']).toBeUndefined();

    const withSeverity = selectSingle(empty, 'q-severity', 'sev2');
    expect(validateProcessStep(step, withSeverity)).toEqual({});
  });

  it('requires a value for required dynamic questions', () => {
    const process = processFixture();
    process.steps[0].questions[2].required = true;
    const step = process.steps[0];
    const state = setDynamicValue(emptyProcessState(process), 'q-note', '');
    expect(validateProcessStep(step, state)['q-note']).toBeTruthy();
    const answered = selectSingle(
      setDynamicValue(state, 'q-note', 'آبگرفتگی'),
      'q-severity',
      'sev1',
    );
    expect(validateProcessStep(step, answered)).toEqual({});
  });
});

describe('processStateToData', () => {
  it('maps relation answers to typed ids and dynamic answers to dynamic_answers', () => {
    const process = processFixture();
    let state = emptyProcessState(process);
    state = selectSingle(state, 'q-severity', 'sev1');
    state = toggleMulti(state, 'q-defects', 'd1');
    state = setDynamicValue(state, 'q-note', 'نیاز به بازدید');

    const data = processStateToData(state, process);
    expect(data['process_version']).toBe(2);
    expect(data['incidentSeverityId']).toBe('sev1');
    expect(data['roadDefectsIds']).toEqual(['d1']);
    expect(data['dynamic_answers']).toEqual([
      {
        step_key: 's1',
        question_key: 'q-note',
        model_name: 'dynamic',
        value: 'نیاز به بازدید',
      },
    ]);
    expect((data['process_state'] as { processId: string }).processId).toBe('proc-1');
  });

  it('omits relation keys without a selection', () => {
    const process = processFixture();
    const data = processStateToData(emptyProcessState(process), process);
    expect(data).not.toHaveProperty('incidentSeverityId');
    expect(data).not.toHaveProperty('dynamic_answers');
  });
});

describe('processDataToState', () => {
  it('restores the full wizard state when process_state was persisted', () => {
    const process = processFixture();
    let state = emptyProcessState(process);
    state = selectSingle(state, 'q-severity', 'sev2');
    const data = processStateToData(state, process);
    const restored = processDataToState(process, data);
    expect(restored.answers['q-severity'].optionIds).toEqual(['sev2']);
  });

  it('rebuilds from typed keys and dynamic_answers for older drafts', () => {
    const process = processFixture();
    const restored = processDataToState(process, {
      incidentSeverityId: 'sev1',
      roadDefectsIds: ['d1'],
      dynamic_answers: [
        { step_key: 's1', question_key: 'q-note', model_name: 'dynamic', value: 'قدیمی' },
      ],
    });
    expect(restored.answers['q-severity'].optionIds).toEqual(['sev1']);
    expect(restored.answers['q-defects'].optionIds).toEqual(['d1']);
    expect(restored.answers['q-note'].value).toBe('قدیمی');
  });
});

describe('flattenQuestions', () => {
  it('visits every question with its step', () => {
    const flat = flattenQuestions(processFixture());
    expect(flat).toHaveLength(3);
    expect(flat[0].step.key).toBe('s1');
  });
});
