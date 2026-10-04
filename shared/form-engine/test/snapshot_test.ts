import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { buildDynamicAnswers } from "../src/snapshot.ts";
import type {
	AnswerTree,
	ContentNode,
	FieldNode,
	FormDefinition,
} from "../src/types.ts";
import { DEFAULT_SCHEMA_VERSION } from "../src/types.ts";

const f = (partial: Partial<FieldNode> & { key: string }): FieldNode => ({
	kind: "field",
	type: "text",
	label: partial.key,
	order: 0,
	...partial,
} as FieldNode);

const def = (
	pages: Array<{ key: string; nodes: ContentNode[] }>,
): FormDefinition => ({
	schemaVersion: DEFAULT_SCHEMA_VERSION,
	name: "x",
	pages: pages.map((page, index) => ({
		key: page.key,
		title: page.key,
		order: index + 1,
		sections: [{
			key: `${page.key}s`,
			title: page.key,
			order: 1,
			nodes: page.nodes,
		}],
	})),
});

// ---------------------------------------------------------------------------

Deno.test("buildDynamicAnswers — a free-text answer stores its value", () => {
	const definition = def([{ key: "scene", nodes: [f({ key: "note" })] }]);
	const answers: AnswerTree = { note: "باران شدید بود" };

	assertEquals(buildDynamicAnswers(definition, answers), [{
		step_key: "scene",
		question_key: "note",
		model_name: "dynamic",
		value: "باران شدید بود",
	}]);
});

Deno.test("buildDynamicAnswers — bound fields are left to buildBindings", () => {
	const definition = def([{
		key: "scene",
		nodes: [
			f({
				key: "collisionTypeId",
				type: "reference",
				options: { kind: "reference", model: "collision_type" },
				binding: { kind: "relation", path: "collision_type" },
			}),
		],
	}]);
	const answers: AnswerTree = { collisionTypeId: "6510aaaa" };

	// The typed key is what the charts query; a duplicate snapshot row would let
	// the two halves drift.
	assertEquals(buildDynamicAnswers(definition, answers), []);
});

Deno.test("buildDynamicAnswers — a binding of kind dynamic is still snapshotted", () => {
	const definition = def([{
		key: "scene",
		nodes: [
			f({ key: "note", binding: { kind: "dynamic" } }),
		],
	}]);
	const answers: AnswerTree = { note: "مهم" };

	assertEquals(buildDynamicAnswers(definition, answers).length, 1);
});

Deno.test("buildDynamicAnswers — a reference answer keeps the id and label", () => {
	const definition = def([{
		key: "scene",
		nodes: [
			f({
				key: "severity",
				type: "choice_group",
				options: {
					kind: "literal",
					items: [
						{ value: "low", label: "کم" },
						{ value: "high", label: "زیاد" },
					],
				},
			}),
		],
	}]);
	const answers: AnswerTree = { severity: "high" };

	// The label is what an officer saw; the value is the stored token.
	assertEquals(buildDynamicAnswers(definition, answers), [{
		step_key: "scene",
		question_key: "severity",
		model_name: "dynamic",
		value: "high",
	}]);
});

Deno.test("buildDynamicAnswers — a reference source names its model", () => {
	const definition = def([{
		key: "scene",
		nodes: [
			f({
				key: "typeId",
				type: "reference",
				options: { kind: "reference", model: "collision_type" },
			}),
		],
	}]);
	const answers: AnswerTree = { typeId: "6510bbbb" };

	assertEquals(buildDynamicAnswers(definition, answers), [{
		step_key: "scene",
		question_key: "typeId",
		model_name: "collision_type",
		answer_id: "6510bbbb",
		answer_name: undefined,
	}]);
});

Deno.test("buildDynamicAnswers — a multi-select reference keeps every id", () => {
	const definition = def([{
		key: "scene",
		nodes: [
			f({
				key: "roadDefectsIds",
				type: "multi_select",
				options: { kind: "reference", model: "road_defect" },
			}),
		],
	}]);
	const answers: AnswerTree = { roadDefectsIds: ["d1", "d2"] };

	assertEquals(buildDynamicAnswers(definition, answers), [{
		step_key: "scene",
		question_key: "roadDefectsIds",
		model_name: "road_defect",
		answer_ids: ["d1", "d2"],
		answer_names: ["d1", "d2"],
	}]);
});

Deno.test("buildDynamicAnswers — a multi-select literal stores labels", () => {
	const definition = def([{
		key: "scene",
		nodes: [
			f({
				key: "tags",
				type: "multi_select",
				options: {
					kind: "literal",
					items: [
						{ value: "wet", label: "جاده خیس" },
						{ value: "dark", label: "تاریکی" },
					],
				},
			}),
		],
	}]);
	const answers: AnswerTree = { tags: ["wet", "dark"] };

	assertEquals(buildDynamicAnswers(definition, answers), [{
		step_key: "scene",
		question_key: "tags",
		model_name: "dynamic",
		answer_names: ["جاده خیس", "تاریکی"],
	}]);
});

Deno.test("buildDynamicAnswers — numbers and booleans are stringified", () => {
	const definition = def([{
		key: "scene",
		nodes: [
			f({ key: "injured", type: "boolean" }),
			f({ key: "count", type: "number" }),
		],
	}]);
	const answers: AnswerTree = { injured: true, count: 3 };

	assertEquals(buildDynamicAnswers(definition, answers), [
		{
			step_key: "scene",
			question_key: "injured",
			model_name: "dynamic",
			value: "true",
		},
		{
			step_key: "scene",
			question_key: "count",
			model_name: "dynamic",
			value: "3",
		},
	]);
});

Deno.test("buildDynamicAnswers — an empty answer produces no row", () => {
	const definition = def([{
		key: "scene",
		nodes: [f({ key: "note" }), f({ key: "count", type: "number" })],
	}]);
	const answers: AnswerTree = { note: "", count: null };

	assertEquals(buildDynamicAnswers(definition, answers), []);
});

Deno.test("buildDynamicAnswers — each page answers under its own page key", () => {
	const definition = def([
		{ key: "scene", nodes: [f({ key: "note" })] },
		{ key: "people", nodes: [f({ key: "witness" })] },
	]);
	const answers: AnswerTree = { note: "الف", witness: "ب" };

	assertEquals(buildDynamicAnswers(definition, answers), [
		{
			step_key: "scene",
			question_key: "note",
			model_name: "dynamic",
			value: "الف",
		},
		{
			step_key: "people",
			question_key: "witness",
			model_name: "dynamic",
			value: "ب",
		},
	]);
});

Deno.test("buildDynamicAnswers — repeatable rows keep their instance path", () => {
	const definition = def([{
		key: "vehicles",
		nodes: [{
			kind: "repeatable",
			key: "vehicles",
			label: "وسیله",
			order: 0,
			children: [
				f({ key: "plate" }),
				f({ key: "injured", type: "number" }),
			],
		} as never],
	}]);
	const answers: AnswerTree = {
		vehicles: [
			{ plate: "۱۱ ب ۲۲۲", injured: 1 },
			{ plate: "۳۳ د ۴۴۴", injured: 0 },
		],
	};

	// Two rows of the same question key must stay distinguishable, which is why
	// the instance path — not the field key — is stored.
	assertEquals(buildDynamicAnswers(definition, answers), [
		{
			step_key: "vehicles",
			question_key: "vehicles[0].plate",
			model_name: "dynamic",
			value: "۱۱ ب ۲۲۲",
		},
		{
			step_key: "vehicles",
			question_key: "vehicles[0].injured",
			model_name: "dynamic",
			value: "1",
		},
		{
			step_key: "vehicles",
			question_key: "vehicles[1].plate",
			model_name: "dynamic",
			value: "۳۳ د ۴۴۴",
		},
		{
			step_key: "vehicles",
			question_key: "vehicles[1].injured",
			model_name: "dynamic",
			value: "0",
		},
	]);
});

Deno.test("buildDynamicAnswers — nested groups keep the full path", () => {
	const definition = def([{
		key: "scene",
		nodes: [{
			kind: "group",
			key: "group",
			label: "گروه",
			order: 0,
			children: [f({ key: "note" })],
		} as never],
	}]);
	const answers: AnswerTree = { group: { note: "درون گروه" } };

	assertEquals(buildDynamicAnswers(definition, answers), [{
		step_key: "scene",
		question_key: "group.note",
		model_name: "dynamic",
		value: "درون گروه",
	}]);
});
