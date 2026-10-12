/**
 * Starting values: what a field holds before the officer touches it.
 *
 * Two mechanisms are covered here — a literal `defaultValue` carried in the
 * definition, and `defaultSource: "now"`, which only a client with a clock can
 * resolve. The interesting cases are the ones about *not* writing: an answer the
 * officer already gave, and a field inside a repeatable, whose row is created
 * empty on purpose.
 *
 * Run: deno task test
 */

import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { formatDefaultMoment, seedDefaultAnswers } from "../src/defaults.ts";
import type {
	AnswerTree,
	ContentNode,
	FieldNode,
	FormDefinition,
	GroupNode,
	RepeatableNode,
} from "../src/types.ts";

const f = (partial: Partial<FieldNode> & { key: string }): FieldNode => ({
	kind: "field",
	type: "text",
	label: partial.key,
	order: 0,
	...partial,
} as FieldNode);

const definitionOf = (...nodes: ContentNode[]): FormDefinition => ({
	schemaVersion: 1,
	name: "تست",
	pages: [{
		key: "p1",
		title: "صفحه",
		order: 1,
		sections: [{ key: "s1", title: "بخش", order: 1, nodes }],
	}],
});

/** A fixed clock: 12 October 2026, 14:37 local time. */
const NOW = new Date(2026, 9, 12, 14, 37, 0, 0);

// ---------------------------------------------------------------------------
// Formatting a clock reading
// ---------------------------------------------------------------------------

Deno.test("formatDefaultMoment — a date, a time and a datetime", () => {
	assertEquals(formatDefaultMoment("date", NOW), "2026-10-12");
	assertEquals(formatDefaultMoment("time", NOW), "14:37");
	assertEquals(formatDefaultMoment("datetime", NOW), "2026-10-12T14:37");
});

Deno.test("formatDefaultMoment — pads every part to two digits", () => {
	const early = new Date(2026, 0, 5, 4, 7, 0, 0);
	assertEquals(formatDefaultMoment("date", early), "2026-01-05");
	assertEquals(formatDefaultMoment("time", early), "04:07");
	assertEquals(formatDefaultMoment("datetime", early), "2026-01-05T04:07");
});

Deno.test("formatDefaultMoment — a bare wall clock, with no zone marker", () => {
	// The hazard this guards: `toISOString()` appends `Z` and shifts the day
	// near midnight, which would file an evening incident under tomorrow. A
	// stored answer is the officer's own clock and nothing else.
	for (const type of ["date", "time", "datetime"] as const) {
		const value = String(formatDefaultMoment(type, NOW));
		assertEquals(/[Zz]$|[+-]\d{2}:?\d{2}$/.test(value), false);
	}
	assertEquals(
		formatDefaultMoment("date", new Date(2026, 9, 12, 23, 45)),
		"2026-10-12",
	);
});

Deno.test("formatDefaultMoment — a non-temporal type has no moment to hold", () => {
	assertEquals(formatDefaultMoment("text", NOW), undefined);
	assertEquals(formatDefaultMoment("number", NOW), undefined);
	assertEquals(formatDefaultMoment("choice_group", NOW), undefined);
	assertEquals(formatDefaultMoment("location", NOW), undefined);
});

// ---------------------------------------------------------------------------
// Seeding a tree
// ---------------------------------------------------------------------------

Deno.test("seedDefaultAnswers — seeds a literal defaultValue", () => {
	const definition = definitionOf(
		f({ key: "severity", type: "choice_group", defaultValue: "خسارتی" }),
	);
	assertEquals(seedDefaultAnswers(definition, {}, NOW), {
		severity: "خسارتی",
	});
});

Deno.test("seedDefaultAnswers — resolves defaultSource by field type", () => {
	const definition = definitionOf(
		f({ key: "date_of_accident", type: "date", defaultSource: "now" }),
		f({ key: "time_of_accident", type: "time", defaultSource: "now" }),
		f({ key: "seen_at", type: "datetime", defaultSource: "now" }),
	);
	assertEquals(seedDefaultAnswers(definition, {}, NOW), {
		date_of_accident: "2026-10-12",
		time_of_accident: "14:37",
		seen_at: "2026-10-12T14:37",
	});
});

Deno.test("seedDefaultAnswers — an answer already given wins over a default", () => {
	// This is what lets a caller merge a saved draft first and seed second: an
	// officer who corrected the date keeps their correction.
	const definition = definitionOf(
		f({ key: "date_of_accident", type: "date", defaultSource: "now" }),
	);
	const answers: AnswerTree = { date_of_accident: "2026-09-30" };
	assertEquals(seedDefaultAnswers(definition, answers, NOW), {
		date_of_accident: "2026-09-30",
	});
});

Deno.test("seedDefaultAnswers — keeps answers it does not own", () => {
	const definition = definitionOf(
		f({ key: "date_of_accident", type: "date", defaultSource: "now" }),
	);
	const answers: AnswerTree = { notes: "توضیح", lane: "خط ۱" };
	assertEquals(seedDefaultAnswers(definition, answers, NOW), {
		notes: "توضیح",
		lane: "خط ۱",
		date_of_accident: "2026-10-12",
	});
});

Deno.test("seedDefaultAnswers — a field declaring nothing is left alone", () => {
	const definition = definitionOf(f({ key: "notes", type: "textarea" }));
	const answers: AnswerTree = { notes: "چیزی" };
	assertEquals(seedDefaultAnswers(definition, answers, NOW), answers);
});

Deno.test("seedDefaultAnswers — returns the same tree when nothing is seeded", () => {
	// Identity, not equality: the caller applies this on every form open, and a
	// fresh object each time would be a state update that renders for nothing.
	const definition = definitionOf(f({ key: "notes", type: "textarea" }));
	const answers: AnswerTree = {};
	assertEquals(
		seedDefaultAnswers(definition, answers, NOW) === answers,
		true,
	);
});

Deno.test("seedDefaultAnswers — does not seed inside a repeatable", () => {
	const definition = definitionOf({
		kind: "repeatable",
		key: "vehicles",
		label: "وسیله نقلیه",
		order: 1,
		minItems: 1,
		children: [f({ key: "seen_at", type: "date", defaultSource: "now" })],
	} as RepeatableNode);

	assertEquals(seedDefaultAnswers(definition, {}, NOW), {});

	// And an existing row is left exactly as it was.
	const answers: AnswerTree = { vehicles: [{ vehicleType: "سواری" }] };
	assertEquals(seedDefaultAnswers(definition, answers, NOW), answers);
});

Deno.test("seedDefaultAnswers — seeds a field nested in a plain group", () => {
	const definition = definitionOf({
		kind: "group",
		key: "timing",
		order: 1,
		children: [f({ key: "seen_at", type: "time", defaultSource: "now" })],
	} as GroupNode);
	assertEquals(seedDefaultAnswers(definition, {}, NOW), { seen_at: "14:37" });
});

Deno.test("seedDefaultAnswers — defaultSource on a non-temporal field is inert", () => {
	// Declaring "now" on a text field is a definition mistake with no sensible
	// value to write, so nothing is written rather than a stringified date.
	const definition = definitionOf(
		f({ key: "notes", type: "text", defaultSource: "now" }),
	);
	assertEquals(seedDefaultAnswers(definition, {}, NOW), {});
});

Deno.test("seedDefaultAnswers — is idempotent", () => {
	const definition = definitionOf(
		f({ key: "date_of_accident", type: "date", defaultSource: "now" }),
	);
	const once = seedDefaultAnswers(definition, {}, NOW);
	const twice = seedDefaultAnswers(definition, once, NOW);
	assertEquals(twice, once);
	assertEquals(twice === once, true);
});
