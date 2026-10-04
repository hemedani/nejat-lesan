import { describe, expect, it } from 'vitest';
import { evalRule, isNodeRequired, resolveOptions, visiblePages } from '@forms';
import type { AnswerTree, ContentNode, FieldNode } from '@forms';
import { qaAccidentFormDefinition } from './qa-accident-form';
import { canLeavePage, reachablePages, setFieldAnswer } from './form-state';

const definition = qaAccidentFormDefinition;

const fieldKeysOf = (pageKey: string): string[] => {
	const page = definition.pages.find((candidate) => candidate.key === pageKey);
	const keys: string[] = [];
	const visit = (nodes: ContentNode[]) => {
		for (const node of nodes) {
			keys.push(node.key);
			if (node.kind !== 'field') visit(node.children);
		}
	};
	for (const section of page?.sections ?? []) visit(section.nodes ?? []);
	return keys;
};

/**
 * Find any node — field, group or repeatable — by key.
 *
 * Not restricted to fields: the conditional-visibility and cascade tests address
 * a repeatable (`damages`) and a choice field, so the lookup has to see both.
 */
const nodeOf = (key: string): ContentNode | undefined => {
	let found: ContentNode | undefined;
	const visit = (nodes: ContentNode[]) => {
		for (const node of nodes) {
			if (node.key === key) found = node;
			if (node.kind !== 'field') visit(node.children);
		}
	};
	for (const page of definition.pages) {
		for (const section of page.sections ?? []) visit(section.nodes ?? []);
	}
	return found;
};

const fieldOf = (key: string): FieldNode | undefined => {
	const node = nodeOf(key);
	return node?.kind === 'field' ? (node as FieldNode) : undefined;
};

/**
 * These tests are the acceptance criterion for the whole engine.
 *
 * The QA team built a 739-line prototype with hand-written JavaScript. Every
 * behaviour below was implemented there in code and is asserted here to come
 * from a *definition alone* — if any of these needs custom code to express, the
 * engine is not general enough and the gap belongs in the engine, not in a
 * special-case definition.
 */
describe('QA form definition — structure', () => {
  it('covers all nine sections of the reference prototype', () => {
    expect(definition.pages).toHaveLength(9);
  });

  it('uses only field types the engine renders', () => {
    const supported = new Set([
      'text', 'textarea', 'number', 'date', 'time', 'datetime', 'select',
      'multi_select', 'boolean', 'choice_group', 'reference', 'plate', 'file',
      'location', 'computed',
    ]);
    const visit = (nodes: ContentNode[]) => {
      for (const node of nodes) {
        if (node.kind === 'field') expect(supported.has(node.type)).toBe(true);
        if (node.kind !== 'field') visit(node.children);
      }
    };
    for (const page of definition.pages) {
      for (const section of page.sections ?? []) visit(section.nodes ?? []);
    }
  });

  it('has no duplicate keys anywhere, since rules address fields by key', () => {
    const seen = new Set<string>();
    const visit = (nodes: ContentNode[]) => {
      for (const node of nodes) {
        expect(seen.has(node.key)).toBe(false);
        seen.add(node.key);
        if (node.kind !== 'field') visit(node.children);
      }
    };
    for (const page of definition.pages) {
      expect(seen.has(page.key)).toBe(false);
      seen.add(page.key);
      for (const section of page.sections ?? []) {
        expect(seen.has(section.key)).toBe(false);
        seen.add(section.key);
        visit(section.nodes ?? []);
      }
    }
  });

  it('nests a repeatable inside a repeatable for passengers', () => {
    const vehicles = fieldKeysOf('vehiclesPage');
    expect(vehicles).toContain('vehicles');
    expect(vehicles).toContain('passengers');
    expect(vehicles).toContain('passenger_health');
  });

  it('binds only fields whose answer is a real scalar', () => {
    // A `relation` binding writes a record id, so it only works on a `reference`
    // field. `severity` and `collision` are literal choices answering 'خسارتی' and
    // 'برخورد با وسیله نقلیه'; binding those to a relation produced a payload the
    // backend rejected at submit time (`typeId: optional(objectIdValidation)`).
    // Their answers are stored losslessly in `dynamic_answers` instead.
    expect(fieldOf('severity')?.binding).toBeUndefined();
    expect(fieldOf('collision')?.binding).toBeUndefined();
    expect(fieldOf('lighting')?.binding).toBeUndefined();

    // The accident date is a real date answer bound onto a top-level scalar, so
    // that one binding is legitimate and keeps the date typed.
    expect(fieldOf('date_of_accident')?.binding).toEqual({
      kind: 'pure',
      path: 'date_of_accident',
    });
  });

  it('never binds a relation to a field that is not a reference list', () => {
    // The invariant, asserted over the whole definition rather than field by
    // field: an id-only answer cannot satisfy a relation.
    const offenders: string[] = [];
    const visit = (nodes: unknown[] | undefined) => {
      for (const node of (nodes ?? []) as Array<Record<string, unknown>>) {
        if (node.kind === 'field') {
          const binding = node.binding as { kind?: string } | undefined;
          const options = node.options as { kind?: string } | undefined;
          if (
            binding && (binding.kind === 'relation' || binding.kind === 'dto') &&
            options?.kind !== 'reference'
          ) {
            offenders.push(String(node.key));
          }
        }
        visit(node.children as unknown[] | undefined);
      }
    };
    for (const page of definition.pages) {
      for (const section of page.sections ?? []) visit(section.nodes);
    }
    expect(offenders).toEqual([]);
  });
});

describe('QA form — conditional visibility (prototype step 7)', () => {
  it('hides the damage page until damage is confirmed', () => {
    const answers: AnswerTree = { hasDamage: 'خیر' };
    expect(reachablePages(definition, answers).map((page) => page.key)).not.toContain(
      'facilityDamage',
    );
  });

  it('shows the damage page once damage is confirmed', () => {
    const answers: AnswerTree = { hasDamage: 'بله' };
    expect(reachablePages(definition, answers).map((page) => page.key)).toContain(
      'facilityDamage',
    );
  });

  it('never renders the damage group when damage is refused', () => {
    const group = nodeOf('damages');
    expect(group?.visibleWhen).toBeDefined();
    expect(evalRule(group!.visibleWhen!, { hasDamage: 'خیر' })).toBe(false);
    expect(evalRule(group!.visibleWhen!, { hasDamage: 'بله' })).toBe(true);
  });
});

describe('QA form — field-shape switching (prototype plateFields)', () => {
  it('shows only the national plate for a national plate type', () => {
    const national = fieldOf('plate_national')!;
    const motorcycle = fieldOf('plate_motorcycle')!;
    const answers: AnswerTree = { plateType: 'ملی' };
    expect(evalRule(national.visibleWhen!, answers)).toBe(true);
    expect(evalRule(motorcycle.visibleWhen!, answers)).toBe(false);
  });

  it('swaps to the motorcycle parts when the type changes', () => {
    const answers: AnswerTree = { plateType: 'موتورسیکلت' };
    expect(evalRule(fieldOf('plate_national')!.visibleWhen!, answers)).toBe(false);
    expect(evalRule(fieldOf('plate_motorcycle')!.visibleWhen!, answers)).toBe(true);
  });

  it('describes a national plate as 2 digits, a letter, 3 digits and 2 digits', () => {
    const parts = fieldOf('plate_national')!.plateVariants![0].parts;
    expect(parts.map((part) => `${part.kind}:${part.length ?? 'x'}`)).toEqual([
      'digits:2',
      'select:x',
      'digits:3',
      'digits:2',
    ]);
  });

  it('describes a motorcycle plate as 3 digits and 5 digits', () => {
    const parts = fieldOf('plate_motorcycle')!.plateVariants![0].parts;
    expect(parts.map((part) => part.length)).toEqual([3, 5]);
  });

  it('asks for temporary-plate parts when the type says so', () => {
    const answers: AnswerTree = { plateType: 'گذر موقت / خاص' };
    expect(evalRule(fieldOf('plate_temporary_a')!.visibleWhen!, answers)).toBe(true);
    expect(evalRule(fieldOf('plate_national')!.visibleWhen!, answers)).toBe(false);
  });
});

describe('QA form — cargo only for heavy vehicles (prototype heavy())', () => {
  it('hides cargo for a passenger car', () => {
    const cargo = fieldOf('cargo')!;
    expect(evalRule(cargo.visibleWhen!, { vehicleType: 'سواری' })).toBe(false);
  });

  it('shows and requires cargo for a truck', () => {
    const cargo = fieldOf('cargo')!;
    const answers: AnswerTree = { vehicleType: 'کامیون' };
    expect(evalRule(cargo.visibleWhen!, answers)).toBe(true);
    expect(isNodeRequired(cargo, answers)).toBe(true);
  });

  it('marks hazardous cargo as a danger tone, as the prototype does', () => {
    const cargo = fieldOf('cargo')!;
    const items = cargo.options?.kind === 'literal' ? cargo.options.items : [];
    expect(items.find((item) => item.value === 'مواد خطرناک')?.tone).toBe('danger');
  });
});

describe('QA form — derived support services (prototype suggestions())', () => {
  it('offers no support list until an emergency is reported', () => {
    const support = fieldOf('support')!;
    expect(evalRule(support.visibleWhen!, { emergency: ['وضعیت اضطراری وجود ندارد'] })).toBe(
      false,
    );
  });

  it('offers support once any emergency is selected', () => {
    const support = fieldOf('support')!;
    expect(evalRule(support.visibleWhen!, { emergency: ['مصدوم'] })).toBe(true);
  });

  it('shows all seven services rather than guessing for the officer', () => {
    // The QA prototype marks suggestions; here the officer chooses, and the
    // advisory rule below catches a mismatch. Choosing for them would be wrong.
    const support = fieldOf('support')!;
    const items = support.options?.kind === 'literal' ? support.options.items : [];
    expect(items).toHaveLength(7);
  });
});

describe('QA form — two-tier validation (prototype errors vs warnings)', () => {
  it('blocks the damage page when it is revealed with no damage recorded', () => {
    const answers: AnswerTree = { hasDamage: 'بله' };
    expect(canLeavePage(definition, answers, 'facilityDamage')).toBe(false);
  });

  it('warns, but does not block, on damage-only severity with a casualty', () => {
    const severity = fieldOf('severity')!;
    const warning = severity.validation!.warnings![0];

    // The prototype's warning: severity is damage-only but a passenger is hurt.
    const answers: AnswerTree = {
      severity: 'خسارتی',
      vehicles: [
        { driver: { health: 'سالم' }, passengers: [{ health: 'مصدوم' }] },
      ],
    };
    expect(evalRule(warning.rule, answers)).toBe(true);
    // A warning must never become a blocker.
    expect(severity.requiredWhen?.op).toBe('always');
  });

  it('does not warn when every person is unharmed', () => {
    const warning = fieldOf('severity')!.validation!.warnings![0];
    const answers: AnswerTree = {
      severity: 'خسارتی',
      vehicles: [{ driver: { health: 'سالم' }, passengers: [{ health: 'سالم' }] }],
      pedestrians: [{ health: 'سالم' }],
    };
    expect(evalRule(warning.rule, answers)).toBe(false);
  });

  it('warns when a vehicle needs a crane that was not requested', () => {
    const warning = fieldOf('support')!.validation!.warnings![0];
    const answers: AnswerTree = {
      emergency: ['مصدوم'],
      vehicles: [{ mobility: 'نیاز به جرثقیل' }],
      support: ['اورژانس ۱۱۵'],
    };
    expect(evalRule(warning.rule, answers)).toBe(true);
  });

  it('clears the crane warning once support includes it', () => {
    const warning = fieldOf('support')!.validation!.warnings![0];
    const answers: AnswerTree = {
      emergency: ['مصدوم'],
      vehicles: [{ mobility: 'نیاز به جرثقیل' }],
      support: ['جرثقیل'],
    };
    expect(evalRule(warning.rule, answers)).toBe(false);
  });
});

describe('QA form — cascade clears (prototype plate type reset)', () => {
  it('clears the national plate parts when the type changes', () => {
    const before: AnswerTree = { plateType: 'ملی', plate_national: { a: '12' } };
    const after = setFieldAnswer(definition, before, 'plateType', 'موتورسیکلت');
    expect(after.plate_national).toBeUndefined();
    expect(after.plateType).toBe('موتورسیکلت');
  });

  it('clears the motorcycle parts when switching back to national', () => {
    const before: AnswerTree = { plateType: 'موتورسیکلت', plate_motorcycle: { a: '123' } };
    const after = setFieldAnswer(definition, before, 'plateType', 'ملی');
    expect(after.plate_motorcycle).toBeUndefined();
  });

  it('declares the cascade on the plate-type field', () => {
    expect(fieldOf('plateType')?.clearOnChange).toEqual([
      'plate_national',
      'plate_motorcycle',
      'plate_free',
    ]);
  });
});

describe('QA form — minimum rows (prototype minItems)', () => {
  it('requires at least one vehicle', () => {
    expect(canLeavePage(definition, {}, 'vehiclesPage')).toBe(false);
  });

  it('still demands a complete vehicle even after a row is added', () => {
    // Adding the row satisfies minItems but not the fields inside it: mobility
    // and a driver are both mandatory per vehicle, as in the prototype.
    expect(canLeavePage(definition, { vehicles: [{ vehicleType: 'سواری' }] }, 'vehiclesPage'))
      .toBe(false);
  });

  it('accepts the vehicles page once each row is complete', () => {
    const answers: AnswerTree = {
      vehicles: [{
        vehicleType: 'سواری',
        plateType: 'ملی',
        plate_national: { a: '12', b: 'ب', c: '345', d: '67' },
        mobility: 'قابل حرکت',
        driver: [{
          driver_presence: 'در صحنه حضور دارد',
          driver_health: 'سالم',
          driver_documents: 'خیر',
        }],
      }],
    };
    expect(canLeavePage(definition, answers, 'vehiclesPage')).toBe(true);
  });
});

describe('QA form — option lists (prototype tone styling)', () => {
  it('marks fire and explosion emergency choices as danger', () => {
    const source = fieldOf('emergency')!.options!;
    expect(source.kind).toBe('literal');
    const items = source.kind === 'literal' ? source.items ?? [] : [];
    expect(items.find((item) => item.value === 'حریق یا دود شدید')?.tone).toBe('danger');
    expect(items.find((item) => item.value === 'مصدوم')?.tone).toBe('warn');
  });

  it('marks full road closure as danger', () => {
    const source = fieldOf('traffic')!.options!;
    const items = source.kind === 'literal' ? source.items ?? [] : [];
    expect(items.find((item) => item.value === 'انسداد کامل')?.tone).toBe('danger');
  });

  it('narrows a field by another answer without a filter, using visibility', () => {
    // Documents are only requested when the officer says they are available.
    const photos = fieldOf('driver_document_photos')!;
    expect(evalRule(photos.visibleWhen!, { driver_documents: 'بله' })).toBe(true);
    expect(evalRule(photos.visibleWhen!, { driver_documents: 'خیر' })).toBe(false);
  });
});

describe('QA form — a complete report validates cleanly', () => {
  it('produces no errors once every required answer is present', () => {
    const answers: AnswerTree = {
      direction: 'اهواز به بندر امام',
      lane: 'خط ۱',
      incident_coords: { lat: 30.86, lng: 48.94 },
      date_of_accident: '2026-10-01',
      time_of_accident: '12:30',
      traffic: 'عادی',
      emergency: ['وضعیت اضطراری وجود ندارد'],
      severity: 'خسارتی',
      collision: 'برخورد با وسیله نقلیه',
      lighting: 'روز',
      weather: 'صاف',
      vehicles: [
        {
          vehicleType: 'سواری',
          plateType: 'ملی',
          plate_national: { a: '12', b: 'ب', c: '345', d: '67' },
          mobility: 'قابل حرکت',
          driver: [{
            driver_presence: 'در صحنه حضور دارد',
            driver_health: 'سالم',
            driver_documents: 'خیر',
          }],
        },
      ],
      hasDamage: 'خیر',
    };

    // Page by page, so a failure names the step that is incomplete.
    for (const page of visiblePages(definition, answers)) {
      expect(
        canLeavePage(definition, answers, page.key),
        `page ${page.key} should be submittable`,
      ).toBe(true);
    }
  });

  it('offers no options for a field whose option list is empty', () => {
    // `damage_vehicleId` is populated from the vehicle list at render time; the
    // definition itself declares no literal options, so it must not pretend.
    expect(resolveOptions(fieldOf('damage_vehicleId')!, {})).toEqual([]);
  });
});