/**
 * Turning an answer tree into a stored snapshot.
 *
 * A form's answers are the authoritative record of what the officer reported,
 * but `accident` stores typed relations — so a report filed through a form needs
 * both halves: the bound values projected onto typed fields
 * (`buildBindings`), and a generic, lossless snapshot of every leaf answer that
 * has no typed home.
 *
 * The snapshot rows are shaped to match `accident.dynamic_answers`, the same
 * embedded array the org process wizard writes, so a review screen has one shape
 * to read regardless of which authoring path produced the report.
 *
 * Every row keeps its `instancePath` (`vehicles[1].plate`) as `question_key`, so
 * a report filled with three vehicles or two nested groups can be reassembled
 * without storing the tree itself.
 */

import { resolvePath } from "./paths.ts";
import { isEmptyAnswer } from "./rules.ts";
import { walkNodes } from "./traverse.ts";
import type {
	AnswerTree,
	AnswerValue,
	ContentNode,
	FieldNode,
	FormDefinition,
	OptionItem,
} from "./types.ts";

/** One row of `accident.dynamic_answers`. */
export type DynamicAnswerRow = {
	step_key?: string;
	question_key: string;
	model_name: string;
	answer_id?: string;
	answer_ids?: string[];
	answer_name?: string;
	answer_names?: string[];
	value?: string;
};

/**
 * The value used for `model_name` when an answer is not tied to a Lesan model.
 * Matches the org process wizard's own sentinel for the same situation.
 */
const DYNAMIC_MODEL_NAME = "dynamic";

/** Options a field offers, when they are known without a network call. */
type ResolvedOption = Pick<OptionItem, "value" | "label">;

/**
 * Literal option labels, so a choice answer snapshots what the officer saw
 * rather than an opaque stored value.
 */
const literalLabels = (
	field: FieldNode,
): Map<string, string> | undefined => {
	if (field.options?.kind !== "literal") return undefined;
	const map = new Map<string, string>();
	for (const item of field.options.items) map.set(item.value, item.label);
	return map;
};

/**
 * `value` for a single answer. Objects are not storable, and an object answer
 * only reaches here as an unexpanded container, which carries no information.
 */
const scalarText = (value: unknown): string | undefined => {
	if (value === null || value === undefined) return undefined;
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return undefined;
};

/** Labels for a multi-value answer, using literal labels where available. */
const listTexts = (
	values: unknown[],
	labels?: Map<string, string>,
): string[] =>
	values
		.map((item) =>
			typeof item === "string"
				? labels?.get(item) ?? item
				: (scalarText(item) ?? "")
		)
		.filter((text) => text.length > 0);

/**
 * Build the stored snapshot rows for an answer tree.
 *
 * Bound fields are skipped: `buildBindings` already projects those onto typed
 * `accident` keys, and duplicating them would let the two halves disagree.
 */
export const buildDynamicAnswers = (
	definition: FormDefinition,
	answers: AnswerTree,
): DynamicAnswerRow[] => {
	const rows: DynamicAnswerRow[] = [];
	const pageKeyOf = new Map<string, string>();

	// Remember which page each node key belongs to, so a row can say where in the
	// form the answer was collected. Containers are walked because a field nested
	// in a group is still on the page that declares the group. Definition keys are
	// unique across the tree, so the last write cannot shadow another page.
	const collect = (nodes: ContentNode[], pageKey: string) => {
		for (const node of nodes) {
			pageKeyOf.set(node.key, pageKey);
			if (node.kind === "group" || node.kind === "repeatable") {
				collect(node.children, pageKey);
			}
		}
	};
	for (const page of definition.pages ?? []) {
		for (const section of page.sections ?? []) {
			collect(section.nodes ?? [], page.key);
		}
	}

	walkNodes(definition, answers, (node, meta) => {
		if (node.kind !== "field") return;
		const field = node as FieldNode;
		if (field.binding && field.binding.kind !== "dynamic") return;

		const raw = readAnswer(answers, meta.instancePath);
		if (isEmptyAnswer(raw)) return;
		const value = raw as AnswerValue;

		const stepKey = pageKeyOf.get(field.key) ?? rootOf(meta.instancePath);
		// Bound fields never reach here, so the only model a row can name is the
		// one a reference field draws its options from.
		const modelName =
			field.options?.kind === "reference"
				? field.options.model
				: DYNAMIC_MODEL_NAME;
		const labels = literalLabels(field);

		if (Array.isArray(value)) {
			// Reference ids stay ids so the row remains joinable; anything else
			// keeps its text in `answer_names`, which is the array the declared
			// schema allows for multi-valued answers.
			const items = value as unknown[];
			if (field.options?.kind === "reference") {
				const ids = items.filter((item): item is string =>
					typeof item === "string"
				);
				if (ids.length > 0) {
					const row: DynamicAnswerRow = {
						step_key: stepKey,
						question_key: meta.instancePath,
						model_name: modelName,
						answer_ids: ids,
					};
					const names = listTexts(ids, labels);
					if (names.length > 0) row.answer_names = names;
					rows.push(row);
				}
				return;
			}
			const texts = listTexts(items, labels);
			if (texts.length > 0) {
				rows.push({
					step_key: stepKey,
					question_key: meta.instancePath,
					model_name: modelName,
					answer_names: texts,
				});
			}
			return;
		}

		if (typeof value === "string") {
			const row: DynamicAnswerRow = {
				step_key: stepKey,
				question_key: meta.instancePath,
				model_name: modelName,
			};
			// A reference answer keeps the id joinable and the label readable.
			if (field.options?.kind === "reference") {
				row.answer_id = value;
				row.answer_name = labels?.get(value);
			} else {
				row.value = value;
			}
			rows.push(row);
			return;
		}

		const text = scalarText(value);
		if (text !== undefined) {
			rows.push({
				step_key: stepKey,
				question_key: meta.instancePath,
				model_name: modelName,
				value: text,
			});
		}
	});

	return rows;
};

/**
 * Read a field's value at its concrete instance path.
 *
 * Resolving the path — rather than reading the nearest scope object — is what
 * makes a field inside a `group` readable: groups nest their children
 * (`{ group: { note } }`) but traversal only pushes repeatable rows onto the
 * scope stack.
 */
const readAnswer = (
	answers: AnswerTree,
	instancePath: string,
): AnswerValue | undefined => resolvePath(answers, instancePath)[0];

const rootOf = (path: string): string => path.split(/[.[]/)[0];
