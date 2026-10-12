/**
 * The values a definition says its fields should *start* with.
 *
 * A definition is written once and answered many times, so "what this field
 * holds before the officer touches it" has to be expressible without code. Two
 * mechanisms cover it:
 *
 *   - `defaultValue`  a literal carried in the definition
 *   - `defaultSource` a value only the client can know, resolved when the form
 *                     is opened — currently `"now"`, which is what the accident
 *                     date and time need: a patrol officer at the roadside is
 *                     describing something that has just happened.
 *
 * Resolution is deliberately a *client* concern. The backend re-runs the same
 * validation on submission, but it has no business guessing a clock reading the
 * officer never chose: by the time a report reaches the server the answer is a
 * literal in the payload, and a missing one is a missing answer.
 *
 * Only top-level fields are seeded. A field inside a repeatable starts empty
 * when its row is added — the same rule `addRow` applies to `defaultValue` —
 * and seeding rows here would mean inventing rows the officer never asked for.
 *
 * Seeding is *additive*: a key already present in the answers is never
 * overwritten. That is what lets a caller merge a saved draft first and seed
 * second, so an officer's own correction to a default always wins.
 */

import { walkNodes } from "./traverse.ts";
import type {
	AnswerTree,
	AnswerValue,
	FieldNode,
	FieldType,
	FormDefinition,
} from "./types.ts";

const pad = (value: number): string => String(value).padStart(2, "0");

/**
 * A clock reading in the format the rest of the system stores for this type.
 *
 *   `date`      2026-10-12
 *   `time`      14:37
 *   `datetime`  2026-10-12T14:37
 *
 * These are the wire formats the app's own picker writes and that
 * `accident.date_of_accident` (a `date()`) and the web panels already read, so a
 * default has to be produced in exactly this shape — anything else would be a
 * value the officer could not have entered by hand.
 *
 * Local parts, never `toISOString()`: the officer's report is about the clock
 * on the wall in front of them, and a UTC conversion would file an evening
 * incident under tomorrow.
 *
 * Returns `undefined` for a type that cannot hold a moment, so `"now"` on a
 * `text` field is inert rather than an error.
 */
export const formatDefaultMoment = (
	type: FieldType,
	now: Date,
): AnswerValue | undefined => {
	if (type !== "date" && type !== "time" && type !== "datetime") {
		return undefined;
	}
	const year = now.getFullYear();
	const month = pad(now.getMonth() + 1);
	const day = pad(now.getDate());
	const date = `${year}-${month}-${day}`;
	const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
	if (type === "date") return date;
	if (type === "time") return clock;
	return `${date}T${clock}`;
};

/** The value a field declares it should start with, or none. */
const startValueOf = (
	field: FieldNode,
	now: Date,
): AnswerValue | undefined =>
	field.defaultSource === "now"
		? formatDefaultMoment(field.type, now)
		: field.defaultValue;

/**
 * Seed the starting values the definition declares, leaving answers intact.
 *
 * Returns the same tree object when there is nothing to seed, so a caller can
 * apply this on every open without causing a needless re-render.
 */
export const seedDefaultAnswers = (
	definition: FormDefinition,
	answers: AnswerTree,
	now: Date = new Date(),
): AnswerTree => {
	const additions: AnswerTree = {};

	walkNodes(definition, answers, (node, meta) => {
		if (node.kind !== "field") return;
		// Repeatable rows are skipped deliberately — see the module note.
		if (meta.depth !== 0 || meta.scope.length > 0) return;

		const field = node as FieldNode;
		// An answer the officer (or their draft) already gave wins.
		if (answers[field.key] !== undefined) return;
		// A duplicated key must not let a later node overwrite an earlier one.
		if (additions[field.key] !== undefined) return;

		const value = startValueOf(field, now);
		if (value === undefined) return;
		additions[field.key] = value;
	});

	return Object.keys(additions).length === 0
		? answers
		: { ...answers, ...additions };
};
