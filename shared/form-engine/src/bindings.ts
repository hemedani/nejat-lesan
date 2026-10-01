/**
 * Binding answers to typed `accident` fields.
 *
 * The QA form's answers are stored generically, but the 34 existing analytics
 * acts query typed `accident` relations and pure fields. A `binding` on a field
 * declares where its value should also be written, so charts keep working
 * without rewriting a single aggregation pipeline.
 *
 * Bindings are a projection only. They never mutate the answer tree, and an
 * unanswered field produces no key — otherwise clearing a required question
 * during offline editing would blank a value the officer already filed.
 */

import { isEmptyAnswer } from "./rules.ts";
import { walkNodes } from "./traverse.ts";
import type {
	AnswerTree,
	AnswerValue,
	Binding,
	FieldNode,
	FormDefinition,
} from "./types.ts";

/**
 * Convert a snake_case relation name into the camelCase key the Lesan acts
 * expect: `road_defects` + multi → `roadDefectsIds`.
 *
 * Matches `mobile/src/domain/process-form.ts:relationSetKey`, so an existing
 * mobile payload shape is produced unchanged.
 */
export const relationSetKey = (path: string, multi?: boolean): string => {
	const camel = path
		.split("_")
		.map((part, index) =>
			index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
		)
		.join("");
	return multi ? `${camel}Ids` : `${camel}Id`;
};

const isRecord = (value: unknown): value is Record<string, AnswerValue> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/** Read a field's value from the nearest scope object that defines it. */
const readValue = (
	answers: AnswerTree,
	scope: AnswerValue[],
	key: string,
): AnswerValue | undefined => {
	for (let i = scope.length - 1; i >= 0; i--) {
		const candidate = scope[i];
		if (isRecord(candidate) && candidate[key] !== undefined) {
			return candidate[key];
		}
	}
	return isRecord(answers) ? answers[key] : undefined;
};

/**
 * Project bound answers onto the shape the `accident` acts expect.
 *
 * Returns a flat object of pure/relation keys plus assembled `*_dtos` arrays.
 * Keys are only present when a value actually exists.
 */
export const buildBindings = (
	definition: FormDefinition,
	answers: AnswerTree,
): Record<string, AnswerValue> => {
	const out: Record<string, AnswerValue> = {};
	const dtoArrays: Record<string, Record<string, AnswerValue>[]> = {};

	walkNodes(definition, answers, (node, meta) => {
		if (node.kind !== "field") return;
		const field = node as FieldNode;
		const binding = field.binding;
		// `dynamic` and unbound fields live only in the generic answer store.
		if (!binding || binding.kind === "dynamic") return;

		const raw = readValue(answers, meta.scope, field.key);
		if (isEmptyAnswer(raw)) return;
		const value = raw as AnswerValue;

		switch (binding.kind) {
			case "relation":
				out[relationSetKey(binding.path, binding.multi)] = value;
				break;

			case "pure":
				out[binding.path] = value;
				break;

			case "dto": {
				// A DTO-bound field inside a repeatable contributes to the row's
				// position in the array, so index alignment is preserved.
				const rowIndex = meta.rowIndex;
				if (rowIndex === undefined) break;
				const rows = (dtoArrays[binding.dto] ??= []);
				rows[rowIndex] = {
					...(rows[rowIndex] ?? {}),
					[binding.field]: value,
				};
				break;
			}
		}
	});

	// Drop holes so a partially filled repeatable does not emit `[undefined]`.
	for (const [name, rows] of Object.entries(dtoArrays)) {
		const compact = rows.filter((row) => row !== undefined);
		if (compact.length > 0) out[name] = compact;
	}

	return out;
};

/**
 * Flatten answers into `field_key → value` rows for reporting and search.
 *
 * This is what makes a nested answer set queryable without a full aggregation
 * pipeline per form: every leaf becomes one row. A repeatable produces one row
 * per row, tagged with its instance path so a report can be reassembled.
 */
export const buildFlatAnswers = (
	definition: FormDefinition,
	answers: AnswerTree,
): Array<{
	field_key: string;
	path: string;
	value?: string;
	values?: string[];
}> => {
	const rows: Array<{
		field_key: string;
		path: string;
		value?: string;
		values?: string[];
	}> = [];

	walkNodes(definition, answers, (node, meta) => {
		if (node.kind !== "field") return;
		const field = node as FieldNode;
		const raw = readValue(answers, meta.scope, field.key);
		if (isEmptyAnswer(raw)) return;
		const value = raw as AnswerValue;

		// A key can repeat across rows (two vehicles), so dedupe by instance.
		if (
			rows.some((row) =>
				row.field_key === field.key && row.path === meta.instancePath
			)
		) {
			return;
		}

		if (Array.isArray(value)) {
			rows.push({
				field_key: field.key,
				path: meta.instancePath,
				values: value.map((item) => stringifyAnswer(item)),
			});
			return;
		}
		rows.push({
			field_key: field.key,
			path: meta.instancePath,
			value: stringifyAnswer(value),
		});
	});

	return rows;
};

const stringifyAnswer = (value: AnswerValue | undefined): string => {
	if (value === null || value === undefined) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	try {
		return JSON.stringify(value);
	} catch {
		return "";
	}
};

/** Re-exported for callers that need the binding type in their own signatures. */
export type { Binding };
