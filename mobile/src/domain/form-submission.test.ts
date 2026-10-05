import { describe, expect, it } from 'vitest';

import type { AnswerTree, FieldNode, FormDefinition } from '@forms';
import { DEFAULT_SCHEMA_VERSION } from '@forms';

import { formAnswersToDraftData, hasFormAnswers, isFormDraftData } from './form-submission';

const f = (partial: Partial<FieldNode> & { key: string }): FieldNode =>
  ({ kind: 'field', type: 'text', label: partial.key, order: 0, ...partial }) as FieldNode;

const def = (nodes: unknown[]): FormDefinition => ({
  schemaVersion: DEFAULT_SCHEMA_VERSION,
  name: 'x',
  pages: [
    {
      key: 'scene',
      title: 'scene',
      order: 1,
      sections: [{ key: 's', title: 's', order: 1, nodes: nodes as never }],
    },
  ],
});

describe('formAnswersToDraftData', () => {
  it('projects a bound relation onto the typed accident key', () => {
    const definition = def([
      f({
        key: 'collisionTypeId',
        type: 'reference',
        options: { kind: 'reference', model: 'collision_type' },
        binding: { kind: 'relation', path: 'collision_type' },
      }),
    ]);
    const answers: AnswerTree = { collisionTypeId: '6510aaaa' };

    const data = formAnswersToDraftData(definition, answers, {});

    // Charts query typed accident relations; a form report must populate them.
    expect(data['collisionTypeId']).toBe('6510aaaa');
  });

  it('snapshots unbound answers so nothing the officer typed is lost', () => {
    const definition = def([f({ key: 'note' })]);
    const answers: AnswerTree = { note: 'باران شدید' };

    const data = formAnswersToDraftData(definition, answers, {});

    expect(data['dynamic_answers']).toEqual([
      {
        step_key: 'scene',
        question_key: 'note',
        model_name: 'dynamic',
        value: 'باران شدید',
      },
    ]);
  });

  it('keeps the answer tree and provenance local to the device', () => {
    const definition = def([f({ key: 'note' })]);
    const answers: AnswerTree = { note: 'یادداشت' };

    const data = formAnswersToDraftData(definition, answers, {
      formId: 'fd-1',
      version: 3,
    });

    expect(data['form_answers']).toEqual(answers);
    expect(data['form_definition_id']).toBe('fd-1');
    expect(data['form_version']).toBe(3);
  });

  it('omits dynamic_answers when every answer was bound', () => {
    const definition = def([
      f({
        key: 'severity',
        type: 'choice_group',
        options: { kind: 'literal', items: [{ value: 'low', label: 'کم' }] },
        binding: { kind: 'relation', path: 'incident_severity' },
      }),
    ]);

    const data = formAnswersToDraftData(definition, { severity: 'low' }, {});

    // An empty array would be forwarded by accident-mapper and rejected by the
    // declared `dynamic_answers` schema's intent — better to leave the key out.
    expect(data).not.toHaveProperty('dynamic_answers');
  });

  it('ignores a non-numeric version instead of storing a string', () => {
    const definition = def([f({ key: 'note' })]);
    const data = formAnswersToDraftData(definition, { note: 'x' }, {
      version: Number.NaN,
    });

    expect(data).not.toHaveProperty('form_version');
  });

  it('collects one snapshot row per repeatable row, tagged by instance path', () => {
    const definition = def([
      {
        kind: 'repeatable',
        key: 'vehicles',
        label: 'وسیله',
        order: 0,
        children: [f({ key: 'note' })],
      },
    ]);
    const answers: AnswerTree = { vehicles: [{ note: 'الف' }, { note: 'ب' }] };

    const data = formAnswersToDraftData(definition, answers, {});

    expect(data['dynamic_answers']).toEqual([
      {
        step_key: 'scene',
        question_key: 'vehicles[0].note',
        model_name: 'dynamic',
        value: 'الف',
      },
      {
        step_key: 'scene',
        question_key: 'vehicles[1].note',
        model_name: 'dynamic',
        value: 'ب',
      },
    ]);
  });
});

describe('isFormDraftData', () => {
  it('recognizes a draft captured through the dynamic form', () => {
    expect(isFormDraftData({ form_definition_id: 'fd-1' })).toBe(true);
  });

  it('does not mistake a process draft or an empty draft for a form draft', () => {
    expect(isFormDraftData({ process_version: 2 })).toBe(false);
    expect(isFormDraftData({})).toBe(false);
    expect(isFormDraftData(null)).toBe(false);
    expect(isFormDraftData(undefined)).toBe(false);
  });

  it('does not accept an empty id — it would render an error, not a form', () => {
    expect(isFormDraftData({ form_definition_id: '' })).toBe(false);
  });
});

describe('hasFormAnswers', () => {
  it('recognizes the answer tree the bundled default form leaves behind', () => {
    // The bundled accident default writes no `form_definition_id` — it has no
    // backend document — so the tree is the only marker that it came from a form.
    expect(hasFormAnswers({ form_answers: {}, form_page_index: 0 })).toBe(true);
    expect(hasFormAnswers({ form_answers: { damage: 'yes' } })).toBe(true);
  });

  it('does not mistake a process draft for a form draft', () => {
    // The process wizard writes `dynamic_answers`; confusing the two would reopen an
    // org-process draft in the wrong editor and lose its answers.
    expect(hasFormAnswers({ dynamic_answers: [{ key: 'x' }], process_version: 3 })).toBe(false);
    expect(hasFormAnswers({})).toBe(false);
    expect(hasFormAnswers(null)).toBe(false);
    expect(hasFormAnswers(undefined)).toBe(false);
  });

  it('rejects a non-object answer value', () => {
    expect(hasFormAnswers({ form_answers: 'nope' })).toBe(false);
    expect(hasFormAnswers({ form_answers: [] })).toBe(false);
    expect(hasFormAnswers({ form_answers: null })).toBe(false);
  });
});
