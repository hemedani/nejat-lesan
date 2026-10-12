import { describe, expect, it } from 'vitest';
import {
  evalRule,
  FORM_ICON_NAMES,
  isFormIconName,
  isNodeRequired,
  resolveOptions,
  seedDefaultAnswers,
  visiblePages,
} from '@forms';
import type { AnswerTree, ContentNode, FieldNode } from '@forms';
import { qaAccidentFormDefinition } from './qa-accident-form';
import { canLeavePage, reachablePages, setFieldAnswer } from './form-state';
import { toStoredValue } from './form-datetime';

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

/** Every node key in the definition, across every page. */
const allKeysOf = (): string[] => {
	const keys: string[] = [];
	const visit = (nodes: ContentNode[]) => {
		for (const node of nodes) {
			keys.push(node.key);
			if (node.kind !== 'field') visit(node.children);
		}
	};
	for (const page of definition.pages) {
		for (const section of page.sections ?? []) visit(section.nodes ?? []);
	}
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

/** The literal options a field declares, or an empty list for any other source. */
const optionsOf = (key: string) => {
	const source = fieldOf(key)?.options;
	return source?.kind === 'literal' ? source.items ?? [] : [];
};

/**
 * These tests are the acceptance criterion for the whole engine.
 *
 * The QA team built a 739-line prototype with hand-written JavaScript. Every
 * behaviour below was implemented there in code and is asserted here to come
 * from a *definition alone* — if any of these needs custom code to express, the
 * engine is not general enough and the gap belongs in the engine, not in a
 * special-case definition.
 *
 * The definition has since moved on from the prototype on the client's
 * instructions (the control centre is not operational yet, the demo road has two
 * carriageways, the driver carries no health field). Those differences are
 * asserted too, and they are all still declarative — the reason this file can
 * keep calling itself the acceptance test.
 */
describe('Accident form definition — structure', () => {
  it('covers every step of the report', () => {
    expect(definition.pages).toHaveLength(8);
  });

  it('numbers the steps without gaps and ends on the review step', () => {
    // Page order is what the stepper reads; a gap left behind by a deleted page
    // would silently reshuffle the wizard.
    expect(definition.pages.map((page) => page.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(definition.pages.at(-1)?.key).toBe('review');
  });

  it('files road-equipment damage on the second-to-last step', () => {
    expect(definition.pages.at(-2)?.key).toBe('facilityDamage');
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

  it('declares only icons the shared form-icon vocabulary can draw', () => {
    // A definition's icons come from `FORM_ICON_NAMES` — Phosphor names such as
    // `mapPin`, `fileText`, `sun` — *not* from Ionicons. The stepper draws them
    // through `FormIcon`, so a definition that carried an Ionicons-style name
    // (`map-pin`) or a typo (`mappin`) would render a blank glyph and log
    // `"…" is not a valid icon name for family "ionicons"`. This is the exact
    // shape of the bug this test exists to keep fixed: the definition's icons are
    // one shared vocabulary, and it has to be the one the renderer resolves.
    const declared: { where: string; icon: unknown }[] = [];
    for (const page of definition.pages) {
      declared.push({ where: `page ${page.key}`, icon: page.icon });
      for (const section of page.sections ?? []) {
        declared.push({ where: `section ${section.key}`, icon: section.icon });
        const visit = (nodes: ContentNode[]) => {
          for (const node of nodes) {
            // `GroupNode` is the one kind with no `icon`, so read it defensively.
            declared.push({
              where: `node ${node.key}`,
              icon: 'icon' in node ? (node.icon as string | undefined) : undefined,
            });
            if (node.kind !== 'field') visit(node.children);
          }
        };
        visit(section.nodes ?? []);
      }
    }

    const present = declared.filter(
      ({ icon }) => icon !== undefined && icon !== null && icon !== '',
    );
    const offenders = present
      .filter(({ icon }) => !isFormIconName(icon))
      .map(({ where, icon }) => `${where}: ${String(icon)}`);

    expect(offenders).toEqual([]);
    // Guard the guard: a walk that collected no icons would pass vacuously, so
    // assert the reference form really does declare some.
    expect(present.length).toBeGreaterThan(0);
    expect(FORM_ICON_NAMES.length).toBeGreaterThan(0);
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

describe('Accident form — the damage question no longer gates its own page', () => {
  it('reaches the damage page before the question is answered', () => {
    // The gate used to be circular: the page only appeared once `hasDamage` was
    // «بله», which made the question that gates it impossible to answer. The page
    // is now unconditional and only the damage *list* depends on the answer.
    expect(reachablePages(definition, {}).map((page) => page.key)).toContain(
      'facilityDamage',
    );
  });

  it('still reaches it when there is no damage at all', () => {
    const answers: AnswerTree = { hasDamage: 'خیر' };
    expect(reachablePages(definition, answers).map((page) => page.key)).toContain(
      'facilityDamage',
    );
  });

  it('never renders the damage list when damage is refused', () => {
    const group = nodeOf('damages');
    expect(group?.visibleWhen).toBeDefined();
    expect(evalRule(group!.visibleWhen!, { hasDamage: 'خیر' })).toBe(false);
    expect(evalRule(group!.visibleWhen!, { hasDamage: 'بله' })).toBe(true);
  });

  it('blocks the page once damage is confirmed but nothing is recorded', () => {
    // «بله» reveals «افزودن آسیب»; `minItems` is what makes one record mandatory.
    expect(canLeavePage(definition, { hasDamage: 'بله' }, 'facilityDamage')).toBe(false);
  });

  it('lets the page through when damage is refused', () => {
    expect(canLeavePage(definition, { hasDamage: 'خیر' }, 'facilityDamage')).toBe(true);
  });

  it('declares no second gate on the damage list', () => {
    // `minItems` is what makes «بله» mean "record at least one", and an invisible
    // node is never required — so a `requiredWhen` here would be dead weight that
    // reads like a second gate without being one.
    const group = nodeOf('damages');
    expect(group?.requiredWhen).toBeUndefined();
    expect(group?.kind === 'repeatable' ? group.minItems : undefined).toBe(1);
  });
});

describe('Accident form — field-shape switching (prototype plateFields)', () => {
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

describe('Accident form — cargo only for heavy vehicles (prototype heavy())', () => {
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
    const items = optionsOf('cargo');
    expect(items.find((item) => item.value === 'مواد خطرناک')?.tone).toBe('danger');
  });
});

describe('Accident form — two-tier validation (prototype errors vs warnings)', () => {
  it('warns, but does not block, on damage-only severity with a casualty', () => {
    const severity = fieldOf('severity')!;
    const warning = severity.validation!.warnings![0];

    // The prototype's warning: severity is damage-only but a passenger is hurt.
    const answers: AnswerTree = {
      severity: 'خسارتی',
      vehicles: [{ passengers: [{ health: 'مصدوم' }] }],
    };
    expect(evalRule(warning.rule, answers)).toBe(true);
    // A warning must never become a blocker.
    expect(severity.requiredWhen?.op).toBe('always');
  });

  it('warns when a damage-only severity hides a driver casualty', () => {
    // The driver has no health field any more, so their condition is carried by
    // `driver_presence`. This is the case that field has to keep visible: a
    // driver is the one person every vehicle always has.
    const warning = fieldOf('severity')!.validation!.warnings![0];
    const answers: AnswerTree = {
      severity: 'خسارتی',
      vehicles: [{ driver: { presence: 'در صحنه فوت شده' } }],
    };
    expect(evalRule(warning.rule, answers)).toBe(true);
  });

  it('does not warn for a driver who merely drove away', () => {
    // «متواری شده است» means the driver left, not that they were hurt — the
    // check must not read it as a casualty.
    const warning = fieldOf('severity')!.validation!.warnings![0];
    const answers: AnswerTree = {
      severity: 'خسارتی',
      vehicles: [{ driver: { presence: 'متواری شده است' } }],
    };
    expect(evalRule(warning.rule, answers)).toBe(false);
  });

  it('does not warn when every person is unharmed', () => {
    const warning = fieldOf('severity')!.validation!.warnings![0];
    const answers: AnswerTree = {
      severity: 'خسارتی',
      vehicles: [
        {
          driver: { presence: 'در صحنه حضور دارد' },
          passengers: [{ health: 'سالم' }],
        },
      ],
      pedestrians: [{ health: 'سالم' }],
    };
    expect(evalRule(warning.rule, answers)).toBe(false);
  });

  it('warns when a vehicle collision has only one vehicle on file', () => {
    // This warning was unreachable until the contradictory `count >= 2` half of
    // its rule was dropped: it read `count >= 2` *and* `not (count >= 2)`.
    const warning = fieldOf('collision')!.validation!.warnings![0];
    const answers: AnswerTree = {
      collision: 'برخورد با وسیله نقلیه',
      vehicles: [{}, {}],
    };
    expect(evalRule(warning.rule, { ...answers, vehicles: [{}] })).toBe(true);
    // Two vehicles is the case the message asks for, so nothing to say.
    expect(evalRule(warning.rule, answers)).toBe(false);
  });

  it('says nothing about a collision that involved no other vehicle', () => {
    const warning = fieldOf('collision')!.validation!.warnings![0];
    const answers: AnswerTree = {
      collision: 'واژگونی و سقوط',
      vehicles: [{}],
    };
    expect(evalRule(warning.rule, answers)).toBe(false);
  });
});

describe('Accident form — cascade clears (prototype plate type reset)', () => {
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

describe('Accident form — minimum rows (prototype minItems)', () => {
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
          driver_documents: 'خیر',
        }],
      }],
    };
    expect(canLeavePage(definition, answers, 'vehiclesPage')).toBe(true);
  });
});

describe('Accident form — option lists (prototype tone styling)', () => {
  it('marks the fatal severity as danger', () => {
    expect(optionsOf('severity').find((item) => item.value === 'فوتی در صحنه')?.tone)
      .toBe('danger');
  });

  it('marks a hazardous-goods tanker as danger', () => {
    expect(optionsOf('vehicleType').find((item) => item.value === 'تانکر حمل مواد خطرناک')?.tone)
      .toBe('danger');
  });

  it('narrows a field by another answer without a filter, using visibility', () => {
    // Documents are only requested when the officer says they are available.
    const photos = fieldOf('driver_document_photos')!;
    expect(evalRule(photos.visibleWhen!, { driver_documents: 'بله' })).toBe(true);
    expect(evalRule(photos.visibleWhen!, { driver_documents: 'خیر' })).toBe(false);
  });
});

describe('Accident form — the client arrangement that replaced the prototype', () => {
  it('offers two carriageways, because the freeway has one lane each way', () => {
    // آزادراه خلیج فارس, the demo organization's road, carries one lane each way:
    // a third lane would be a lane the officer cannot be standing in.
    expect(optionsOf('lane').map((item) => item.value)).toEqual([
      'شانه راست',
      'خط ۱',
      'خط ۲',
      'شانه چپ / میانی',
    ]);
  });

  it('does not offer pedestrians or cyclists as collision partners', () => {
    const values = optionsOf('collision').map((item) => item.value);
    expect(values).not.toContain('برخورد با عابر');
    expect(values).not.toContain('برخورد با دوچرخه');
    // A narrowing, not a rewrite: the rest of the list is untouched.
    expect(values).toContain('برخورد با موتورسیکلت');
  });

  it('asks for the driver before the passengers', () => {
    const order = fieldKeysOf('vehiclesPage');
    expect(order.indexOf('driver')).toBeGreaterThan(-1);
    expect(order.indexOf('driver')).toBeLessThan(order.indexOf('passengers'));
  });

  it('has no driver health field, because driver_presence already records it', () => {
    const order = fieldKeysOf('vehiclesPage');
    expect(order).not.toContain('driver_health');
    expect(order).toContain('driver_presence');
  });

  it('starts the accident date and time at now', () => {
    // A patrol officer at the roadside is describing something that has just
    // happened, so both fields open pre-filled.
    expect(fieldOf('date_of_accident')?.defaultSource).toBe('now');
    expect(fieldOf('time_of_accident')?.defaultSource).toBe('now');
  });

  it('seeds them in the format the picker itself writes', () => {
    // The engine resolves the default and `form-datetime` formats a value the
    // officer picked. If the two ever disagreed, the pre-filled answer would be a
    // shape the picker could not read back and the field would look empty the
    // moment it was opened.
    const now = new Date(2026, 9, 12, 14, 37, 0, 0);
    expect(seedDefaultAnswers(definition, {}, now)).toEqual({
      date_of_accident: toStoredValue('date', now),
      time_of_accident: toStoredValue('time', now),
    });
  });

  it('leaves a date the officer already chose alone', () => {
    const now = new Date(2026, 9, 12, 14, 37, 0, 0);
    const answers: AnswerTree = { date_of_accident: '2026-09-30' };
    expect(seedDefaultAnswers(definition, answers, now)).toEqual({
      date_of_accident: '2026-09-30',
      time_of_accident: toStoredValue('time', now),
    });
  });

  it('no longer carries the traffic and emergency page', () => {
    // The control centre that page fed is not operational yet, so the whole step
    // is gone rather than hidden — including the support list it derived.
    expect(definition.pages.map((page) => page.key)).not.toContain('emergencyActions');

    const keys = allKeysOf();
    for (
      const gone of [
        'traffic',
        'emergency',
        'emergencyNotes',
        'support',
        'supportNotes',
        'sceneSection',
        'supportSection',
      ]
    ) {
      expect(keys).not.toContain(gone);
    }
  });
});

describe('Accident form — a complete report validates cleanly', () => {
  it('produces no errors once every required answer is present', () => {
    const answers: AnswerTree = {
      direction: 'اهواز به بندر امام',
      lane: 'خط ۱',
      incident_coords: { lat: 30.86, lng: 48.94 },
      date_of_accident: '2026-10-01',
      time_of_accident: '12:30',
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
