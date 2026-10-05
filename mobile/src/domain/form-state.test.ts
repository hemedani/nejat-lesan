import { describe, expect, it } from 'vitest';
import type { AnswerTree, AnswerValue, FormDefinition } from '@forms';
import {
  addNestedRow,
  addRow,
  canLeavePage,
  instancePathOf,
  isDefinitionRenderable,
  issuesByNode,
  mergeAnswers,
  normalizeDefinition,
  parseAnswers,
  reachablePages,
  readRows,
  removeNestedRow,
  removeRow,
  seedCapturedAnswers,
  setNestedRowAnswer,
  serializeAnswers,
  setFieldAnswer,
  setRowAnswer,
  setRowFieldAnswer,
  toggleMultiAnswer,
  validateAll,
  validatePage,
} from './form-state';

/**
 * A miniature version of the QA form's hardest shape: a conditional page, a
 * repeatable with a nested repeatable, and a field that must clear its dependents
 * when its controlling answer changes.
 */
const definition: FormDefinition = {
  schemaVersion: 1,
  name: 'گزارش',
  pages: [
    {
      key: 'scene',
      title: 'وضعیت صحنه',
      order: 1,
      sections: [
        {
          key: 'sceneSection',
          title: 'وضعیت',
          order: 1,
          nodes: [
            {
              kind: 'field',
              key: 'severity',
              type: 'choice_group',
              label: 'شدت',
              order: 1,
              requiredWhen: { op: 'always' },
              options: {
                kind: 'literal',
                items: [
                  { value: 'خسارتی', label: 'خسارتی' },
                  { value: 'جرحی', label: 'جرحی' },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      key: 'damage',
      title: 'آسیب',
      order: 2,
      visibleWhen: { op: 'eq', path: 'hasDamage', value: 'بله' },
      sections: [
        {
          key: 'damageSection',
          title: 'آسیب',
          order: 1,
          nodes: [
            {
              kind: 'repeatable',
              key: 'damages',
              label: 'آسیب',
              order: 1,
              minItems: 1,
              children: [
                { kind: 'field', key: 'type', type: 'text', label: 'نوع', order: 1, requiredWhen: { op: 'always' } },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'vehicles',
      title: 'وسایل',
      order: 3,
      sections: [
        {
          key: 'vehiclesSection',
          title: 'وسایل',
          order: 1,
          nodes: [
            {
              kind: 'repeatable',
              key: 'vehicles',
              label: 'وسیله',
              order: 1,
              minItems: 1,
              maxItems: 3,
              children: [
                {
                  kind: 'field',
                  key: 'plateType',
                  type: 'choice_group',
                  label: 'نوع پلاک',
                  order: 1,
                  clearOnChange: ['plate'],
                  options: {
                    kind: 'literal',
                    items: [
                      { value: 'ملی', label: 'ملی' },
                      { value: 'موتورسیکلت', label: 'موتورسیکلت' },
                    ],
                  },
                },
                { kind: 'field', key: 'plate', type: 'plate', label: 'پلاک', order: 2 },
                {
                  kind: 'repeatable',
                  key: 'passengers',
                  label: 'سرنشین',
                  order: 3,
                  children: [
                    { kind: 'field', key: 'health', type: 'choice_group', label: 'وضعیت', order: 1, requiredWhen: { op: 'always' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe('normalizeDefinition', () => {
  it('fills in a missing title and order', () => {
    const normalized = normalizeDefinition({ pages: [{ key: 'p', sections: [] }] });
    expect(normalized.pages[0].title).toBeTruthy();
    expect(normalized.pages[0].order).toBe(1);
  });

  it('survives a null or non-object payload', () => {
    expect(normalizeDefinition(null).pages).toEqual([]);
    expect(normalizeDefinition('nonsense').pages).toEqual([]);
  });

  it('drops pages with no key, which would crash the renderer', () => {
    const normalized = normalizeDefinition({ pages: [{ title: 'بدون کلید' }, { key: 'ok', sections: [] }] });
    expect(normalized.pages).toHaveLength(1);
    expect(normalized.pages[0].key).toBe('ok');
  });
});

describe('isDefinitionRenderable', () => {
  it('accepts a definition this build understands', () => {
    expect(isDefinitionRenderable(normalizeDefinition(definition))).toBe(true);
  });

  it('rejects an empty definition so the built-in flow is used instead', () => {
    expect(isDefinitionRenderable(normalizeDefinition({ pages: [] }))).toBe(false);
  });

  it('rejects a newer schema_version rather than rendering it partly', () => {
    const future = normalizeDefinition({ ...definition, schemaVersion: 99 });
    expect(isDefinitionRenderable(future)).toBe(false);
  });
});

describe('reachablePages', () => {
  it('hides a conditional page until its condition holds', () => {
    const answers: AnswerTree = { hasDamage: 'خیر' };
    expect(reachablePages(definition, answers).map((page) => page.key)).toEqual([
      'scene',
      'vehicles',
    ]);
  });

  it('reveals it once the condition holds', () => {
    const answers: AnswerTree = { hasDamage: 'بله' };
    expect(reachablePages(definition, answers).map((page) => page.key)).toEqual([
      'scene',
      'damage',
      'vehicles',
    ]);
  });
});

describe('setFieldAnswer cascades', () => {
  it('clears a dependent value when the controlling answer changes', () => {
    const before: AnswerTree = {
      vehicles: [{ plateType: 'ملی', plate: { parts: ['12', 'ب', '345'] } }],
    };
    // A field inside a repeatable is addressed by its instance path, so the
    // cascade is scoped to that row rather than the whole tree.
    const after = setFieldAnswer(definition, before, 'vehicles[0].plateType', 'موتورسیکلت');
    expect((after.vehicles as Array<Record<string, unknown>>)[0].plate).toBeUndefined();
    expect((after.vehicles as Array<Record<string, unknown>>)[0].plateType).toBe('موتورسیکلت');
  });

  it('keeps the dependent value when the answer is unchanged', () => {
    const before: AnswerTree = { vehicles: [{ plateType: 'ملی', plate: { parts: ['12'] } }] };
    const after = setFieldAnswer(definition, before, 'vehicles[0].plateType', 'ملی');
    expect((after.vehicles as Array<Record<string, unknown>>)[0].plate).toEqual({ parts: ['12'] });
  });

  it('clears only the addressed row, leaving siblings intact', () => {
    const before: AnswerTree = {
      vehicles: [
        { plateType: 'ملی', plate: { parts: ['12'] } },
        { plateType: 'ملی', plate: { parts: ['98'] } },
      ],
    };
    const after = setFieldAnswer(definition, before, 'vehicles[1].plateType', 'موتورسیکلت');
    const rows = after.vehicles as Array<Record<string, unknown>>;
    expect(rows[0].plate).toEqual({ parts: ['12'] });
    expect(rows[1].plate).toBeUndefined();
  });

  it('is immutable', () => {
    const before: AnswerTree = { vehicles: [{ plateType: 'ملی', plate: { parts: ['1'] } }] };
    setFieldAnswer(definition, before, 'vehicles[0].plateType', 'موتورسیکلت');
    expect((before.vehicles as Array<Record<string, unknown>>)[0].plate).toEqual({ parts: ['1'] });
  });
});

describe('toggleMultiAnswer', () => {
  it('adds then removes a value', () => {
    let tree: AnswerTree = {};
    tree = toggleMultiAnswer(tree, 'support', 'اورژانس ۱۱۵');
    expect(tree.support).toEqual(['اورژانس ۱۱۵']);
    tree = toggleMultiAnswer(tree, 'support', 'اورژانس ۱۱۵');
    expect(tree.support).toEqual([]);
  });
});

describe('repeatable rows', () => {
  it('adds a row', () => {
    const tree = addRow(definition, { vehicles: [] }, 'vehicles');
    expect(Array.isArray(tree.vehicles)).toBe(true);
    expect((tree.vehicles as unknown[]).length).toBe(1);
  });

  it('respects maxItems', () => {
    let tree: AnswerTree = { vehicles: [{}, {}, {}] };
    tree = addRow(definition, tree, 'vehicles');
    expect((tree.vehicles as unknown[]).length).toBe(3);
  });

  it('ignores an out-of-range removal', () => {
    const tree = { vehicles: [{ type: 'a' }] };
    expect(removeRow(tree, 'vehicles', 5)).toEqual(tree);
  });

  it('sets a value inside a nested row at the named index', () => {
    const tree: AnswerTree = {
      vehicles: [
        { type: 'سواری', passengers: [{ health: 'سالم' }] },
        { type: 'کامیون', passengers: [{ health: 'سالم' }] },
      ],
    };
    const next = setNestedRowAnswer(
      tree,
      ['vehicles', 1, 'passengers'],
      0,
      'health',
      'مصدوم',
    );
    const rows = next.vehicles as Array<Record<string, unknown>>;
    expect(((rows[0].passengers as Array<Record<string, unknown>>)[0]).health).toBe('سالم');
    expect(((rows[1].passengers as Array<Record<string, unknown>>)[0]).health).toBe('مصدوم');
  });

  it('sets a value inside one row only', () => {
    const tree: AnswerTree = { vehicles: [{ type: 'سواری' }, { type: 'کامیون' }] };
    const next = setRowAnswer(tree, 'vehicles', 1, 'type', 'تریلی');
    const rows = next.vehicles as Array<Record<string, unknown>>;
    expect(rows[0].type).toBe('سواری');
    expect(rows[1].type).toBe('تریلی');
  });

  it('removes a nested row from the row the path names', () => {
    const tree: AnswerTree = {
      vehicles: [
        { type: 'سواری', passengers: [{ health: 'سالم' }, { health: 'مصدوم' }] },
        { type: 'کامیون', passengers: [{ health: 'سالم' }, { health: 'مصدوم' }] },
      ],
    };
    // Target vehicle 1's passengers, not vehicle 0's.
    const next = removeNestedRow(tree, ['vehicles', 1, 'passengers'], 0);
    const rows = next.vehicles as Array<Record<string, unknown>>;
    expect(rows[0].type).toBe('سواری');
    expect((rows[0].passengers as unknown[]).length).toBe(2);
    expect(rows[1].type).toBe('کامیون');
    expect((rows[1].passengers as unknown[]).length).toBe(1);
  });

  it('removes a top-level nested row via the same helper', () => {
    const tree: AnswerTree = { damages: [{ type: 'گاردریل' }, { type: 'تابلو' }] };
    const next = removeNestedRow(tree, ['damages'], 0);
    expect((next.damages as unknown[]).length).toBe(1);
  });
});

/**
 * The renderer addresses a row field by its row chain — the repeatable key
 * followed by the index chosen at each level. These cover the helpers that turn
 * that chain into a write, because the previous implementation built the chain
 * in the wrong order and silently discarded every write *inside* a row: a new
 * vehicle could be added, but none of its fields could be filled in.
 */
describe('row field addressing', () => {
  it('renders a row chain as an instance path', () => {
    expect(instancePathOf(['vehicles', 0])).toBe('vehicles[0]');
    expect(instancePathOf(['vehicles', 0, 'passengers', 1])).toBe('vehicles[0].passengers[1]');
  });

  it('reads rows from the nearest enclosing row, not the answer root', () => {
    const scope: AnswerValue[] = [{ passengers: [{ health: 'سالم' }] }];
    expect(readRows({}, scope, 'passengers')).toEqual([{ health: 'سالم' }]);
  });

  it('falls back to the answer root for a top-level repeatable', () => {
    expect(readRows({ damages: [{ type: 'گاردریل' }] }, [], 'damages')).toEqual([{ type: 'گاردریل' }]);
  });

  it('writes a field on a top-level row', () => {
    const before: AnswerTree = { vehicles: [{}, {}] };
    const after = setRowFieldAnswer(definition, before, ['vehicles', 1], 'plateType', 'ملی');
    const rows = after.vehicles as Array<Record<string, unknown>>;
    expect(rows[1].plateType).toBe('ملی');
    expect(rows[0].plateType).toBeUndefined();
  });

  it('writes a field on a nested row addressed by its full chain', () => {
    const before: AnswerTree = { vehicles: [{ passengers: [{}] }] };
    const after = setRowFieldAnswer(
      definition,
      before,
      ['vehicles', 0, 'passengers', 0],
      'health',
      'مصدوم',
    );
    const rows = after.vehicles as Array<Record<string, unknown>>;
    expect((rows[0].passengers as Array<Record<string, unknown>>)[0].health).toBe('مصدوم');
  });

  it('drives the row’s own cascade, clearing only the edited row', () => {
    const before: AnswerTree = {
      vehicles: [
        { plateType: 'ملی', plate: { parts: ['12'] } },
        { plateType: 'ملی', plate: { parts: ['98'] } },
      ],
    };
    const after = setRowFieldAnswer(definition, before, ['vehicles', 0], 'plateType', 'موتورسیکلت');
    const rows = after.vehicles as Array<Record<string, unknown>>;
    expect(rows[0].plateType).toBe('موتورسیکلت');
    expect(rows[0].plate).toBeUndefined();
    // The sibling row is untouched: a cascade is anchored to the changed row.
    expect(rows[1].plate).toEqual({ parts: ['98'] });
  });

  it('clears the key outright rather than storing undefined', () => {
    const before: AnswerTree = { vehicles: [{ plateType: 'ملی' }] };
    const after = setRowFieldAnswer(definition, before, ['vehicles', 0], 'plateType', undefined);
    const rows = after.vehicles as Array<Record<string, unknown>>;
    expect('plateType' in rows[0]).toBe(false);
  });

  it('is a no-op when the chain does not end in a row index', () => {
    const before: AnswerTree = { vehicles: [{}] };
    expect(setRowFieldAnswer(definition, before, ['vehicles'], 'plateType', 'ملی')).toBe(before);
  });

  it('supports the add-then-fill cycle inside a nested repeatable', () => {
    // Mirrors the QA flow the bug report describes: add a vehicle, add a row
    // inside it (a passenger / driver), then answer a field on that row.
    let tree: AnswerTree = addNestedRow({}, ['vehicles'], {});
    tree = addNestedRow(tree, ['vehicles', 0, 'passengers'], {});
    tree = setRowFieldAnswer(definition, tree, ['vehicles', 0, 'passengers', 0], 'health', 'مصدوم');

    const rows = tree.vehicles as Array<Record<string, unknown>>;
    const passengers = rows[0].passengers as Array<Record<string, unknown>>;
    expect(passengers).toHaveLength(1);
    expect(passengers[0].health).toBe('مصدوم');

    // And it reads back through the very scope the renderer passes down.
    expect(readRows(tree, [rows[0] as AnswerValue], 'passengers')).toEqual([{ health: 'مصدوم' }]);
  });

  it('is immutable', () => {
    const before: AnswerTree = { vehicles: [{ plateType: 'ملی' }] };
    setRowFieldAnswer(definition, before, ['vehicles', 0], 'plateType', 'موتورسیکلت');
    expect((before.vehicles as Array<Record<string, unknown>>)[0].plateType).toBe('ملی');
  });
});

describe('validatePage / canLeavePage', () => {
  it('blocks leaving a page whose own required answer is missing', () => {
    expect(canLeavePage(definition, {}, 'scene')).toBe(false);
  });

  it('allows leaving once the page is complete', () => {
    expect(canLeavePage(definition, { severity: 'جرحی' }, 'scene')).toBe(true);
  });

  it('ignores an error on a different page', () => {
    // Severity is missing, but we are standing on the vehicles page.
    expect(canLeavePage(definition, { severity: 'جرحی' }, 'scene')).toBe(true);
    expect(validatePage(definition, { severity: 'جرحی' }, 'vehicles').errors.length).toBeGreaterThan(0);
  });

  it('does not report a hidden page’s errors', () => {
    // hasDamage is unanswered, so the damage page is hidden and irrelevant.
    const result = validateAll(definition, { severity: 'جرحی' });
    expect(result.errors.every((issue) => issue.nodeKey !== 'type')).toBe(true);
  });

  it('reports the damage page once the condition reveals it', () => {
    const result = validateAll(definition, { severity: 'جرحی', hasDamage: 'بله' });
    expect(result.blockedPages).toContain('damage');
  });
});

describe('issuesByNode', () => {
  it('groups issues so a field can render its own error', () => {
    const result = validateAll(definition, {});
    const { errors } = issuesByNode(result);
    expect(errors.get('severity')).toBeDefined();
  });
});

describe('draft persistence', () => {
  it('round-trips through serialize/parse', () => {
    const tree: AnswerTree = { severity: 'جرحی', vehicles: [{ type: 'سواری' }] };
    expect(parseAnswers(serializeAnswers(tree))).toEqual(tree);
  });

  it('returns an empty tree for corrupt or absent JSON', () => {
    // A corrupt draft must not block incident creation.
    expect(parseAnswers('{not json')).toEqual({});
    expect(parseAnswers(undefined)).toEqual({});
    expect(parseAnswers('[1,2,3]')).toEqual({});
  });

  it('preserves unknown keys from a newer build', () => {
    const stored = { severity: 'جرحی', futureField: 'kept' };
    const merged = mergeAnswers(stored, { severity: 'خسارتی' });
    expect(merged.futureField).toBe('kept');
    expect(merged.severity).toBe('خسارتی');
  });

  it('ignores undefined values in the incoming set', () => {
    const merged = mergeAnswers({ a: '1' }, { b: undefined as never });
    expect(merged.a).toBe('1');
    expect('b' in merged).toBe(false);
  });
});

/**
 * The QA form's first page requires a `location` field, but the point is captured
 * on the map screen and stored on the draft — the field itself never writes an
 * answer. Without projecting it back, that page can never be left, which is the
 * bug these cover.
 */
describe('seedCapturedAnswers', () => {
  const locationDefinition: FormDefinition = {
    schemaVersion: 1,
    name: 'موقعیت',
    pages: [
      {
        key: 'location',
        title: 'موقعیت واقعه',
        order: 1,
        sections: [
          {
            key: 'locationSection',
            title: 'موقعیت',
            order: 1,
            nodes: [
              // Deliberately *not* named `incident_coords`: matching is by type,
              // so a definition is free to name the field anything.
              {
                kind: 'field',
                key: 'point',
                type: 'location',
                label: 'موقعیت روی نقشه',
                order: 1,
                requiredWhen: { op: 'always' },
              },
              {
                kind: 'field',
                key: 'note',
                type: 'text',
                label: 'توضیح',
                order: 2,
              },
            ],
          },
        ],
      },
    ],
  };

  const point = { latitude: 35.6892, longitude: 51.389 };

  it('writes the captured point onto a location field', () => {
    const seeded = seedCapturedAnswers(locationDefinition, {}, { location: point });
    expect(seeded.point).toEqual(point);
  });

  it('makes the required page satisfiable', () => {
    const seeded = seedCapturedAnswers(locationDefinition, {}, { location: point });
    // This is the actual regression: before the seed, the page could not be left.
    expect(validatePage(locationDefinition, seeded, 'location').errors).toEqual([]);
    expect(validatePage(locationDefinition, {}, 'location').errors.length).toBeGreaterThan(0);
  });

  it('overwrites a stale point so a moved location wins', () => {
    const stale = { point: { latitude: 1, longitude: 2 } };
    const seeded = seedCapturedAnswers(locationDefinition, stale, { location: point });
    expect(seeded.point).toEqual(point);
  });

  it('leaves other answers untouched', () => {
    const seeded = seedCapturedAnswers(locationDefinition, { note: 'محفوظ' }, { location: point });
    expect(seeded.note).toBe('محفوظ');
  });

  it('is a no-op when no point was captured', () => {
    const answers = { note: 'محفوظ' };
    expect(seedCapturedAnswers(locationDefinition, answers, { location: null })).toBe(answers);
    expect(seedCapturedAnswers(locationDefinition, answers, {})).toBe(answers);
  });

  it('does not invent a key for a definition with no location field', () => {
    const textOnly: FormDefinition = {
      schemaVersion: 1,
      name: 'متن',
      pages: [{
        key: 'p',
        title: 'صفحه',
        order: 1,
        sections: [{
          key: 's',
          title: 'بخش',
          order: 1,
          nodes: [{ kind: 'field', key: 'note', type: 'text', label: 'توضیح', order: 1 }],
        }],
      }],
    };
    const seeded = seedCapturedAnswers(textOnly, { note: 'x' }, { location: point });
    expect(seeded).toEqual({ note: 'x' });
  });
});