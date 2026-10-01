/**
 * Form-definition schema tests.
 *
 * Covers the superstruct envelope for a recursive definition tree — nested
 * repeatable groups, rule trees, option sources, bindings, plate variants and
 * response issues — plus the `defaulted` vs `optional` trap that makes a
 * definition validate on `add` but fail on `update`.
 *
 * Schema-only: it needs no MongoDB. The act behaviour (activate validation,
 * getForPatrol option resolution, reference-option stripping) lives in
 * `form-definition-test.ts`.
 *
 * Run: deno test -A test/form-definition-schema-test.ts
 */

import "./patrol_ops_env.ts";
import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
// NOTE: back/mod.ts must be evaluated before the model file (circular-init
// ordering), matching every other test in this directory.
import "../mod.ts";
import { assert as structAssert } from "@deps";
import {
	form_content_node_struct,
	form_definition_struct,
	form_issue_struct,
	form_page_struct,
	form_section_struct,
} from "../models/form_definition.ts";
import type { Struct } from "@deps";

const valid = (value: unknown, struct: unknown) =>
	structAssert(value, struct as Struct);

const rejects = (value: unknown, struct: unknown) => {
	try {
		structAssert(value, struct as Struct);
		return false;
	} catch {
		return true;
	}
};

const node = (overrides: Record<string, unknown> = {}) => ({
	kind: "field",
	key: "f1",
	type: "text",
	label: "برچسب",
	...overrides,
});

/** A definition shaped like the QA accident form, with nested repeatables. */
const qaTree = {
	pages: [{
		key: "p1",
		title: "موقعیت واقعه",
		order: 1,
		sections: [{
			key: "s1",
			title: "اطلاعات",
			nodes: [
				node({ key: "severity", type: "choice_group" }),
				node({
					key: "vehicles",
					kind: "repeatable",
					label: "وسایل نقلیه",
					minItems: 1,
					children: [
						node({ key: "type", type: "reference" }),
						node({
							key: "passengers",
							kind: "repeatable",
							label: "سرنشین",
							children: [
								node({ key: "health", type: "choice_group" }),
							],
						}),
					],
				}),
			],
		}],
	}],
};

Deno.test("form_definition_struct — accepts a nested QA-shaped tree", () => {
	valid(qaTree, form_definition_struct);
});

Deno.test("form_definition_struct — accepts an empty definition", () => {
	valid({}, form_definition_struct);
});

Deno.test("form_definition_struct — rejects a page with no title", () => {
	assert(
		rejects(
			{ pages: [{ key: "p", sections: [] }] },
			form_definition_struct,
		),
	);
});

Deno.test("form_content_node_struct — accepts every node kind", () => {
	valid(node({ kind: "field", type: "plate" }), form_content_node_struct);
	valid(
		node({ kind: "group", children: [node()] }),
		form_content_node_struct,
	);
	valid(
		node({ kind: "repeatable", children: [node()] }),
		form_content_node_struct,
	);
});

Deno.test("form_content_node_struct — rejects an unknown kind", () => {
	assert(rejects(node({ kind: "nope" }), form_content_node_struct));
});

Deno.test("form_content_node_struct — requires a key", () => {
	assert(rejects({ kind: "field", type: "text" }, form_content_node_struct));
});

Deno.test("form_content_node_struct — accepts conditional visibility", () => {
	valid(
		node({ visibleWhen: { op: "eq", path: "severity", value: "جرحی" } }),
		form_content_node_struct,
	);
});

Deno.test("form_content_node_struct — accepts a composite and/or rule", () => {
	valid(
		node({
			validation: {
				warnings: [{
					rule: {
						op: "and",
						rules: [
							{
								op: "anyIn",
								path: "vehicles[].driver.health",
								value: ["مصدوم"],
							},
							{
								op: "not",
								rule: {
									op: "contains",
									path: "support",
									value: "جرثقیل",
								},
							},
						],
					},
					message: "پشتیبانی انتخاب نشده است.",
				}],
			},
		}),
		form_content_node_struct,
	);
});

Deno.test("form_content_node_struct — accepts narrowed options", () => {
	valid(
		node({
			options: {
				kind: "literal",
				items: [{ value: "سواری", label: "سواری", tone: "normal" }],
			},
			optionsFilter: {
				mode: "dynamic",
				rule: { op: "eq", path: "hazmat", value: "بله" },
				values: ["سواری"],
			},
		}),
		form_content_node_struct,
	);
});

Deno.test("form_content_node_struct — accepts a reference option source", () => {
	valid(
		node({
			type: "reference",
			options: { kind: "reference", model: "collision_type" },
			binding: { kind: "relation", path: "collision_type" },
		}),
		form_content_node_struct,
	);
});

Deno.test("form_content_node_struct — accepts each binding kind", () => {
	for (
		const binding of [
			{ kind: "relation", path: "collision_type" },
			{ kind: "relation", path: "road_defects", multi: true },
			{
				kind: "dto",
				dto: "vehicle_dtos",
				field: "vehicle_type",
				from: "type",
			},
			{ kind: "pure", path: "date_of_accident" },
			{ kind: "dynamic" },
		]
	) {
		valid(node({ binding }), form_content_node_struct);
	}
});

Deno.test("form_content_node_struct — rejects an unknown binding kind", () => {
	assert(
		rejects(node({ binding: { kind: "nope" } }), form_content_node_struct),
	);
});

Deno.test("form_content_node_struct — accepts cascade clears", () => {
	valid(
		node({ key: "plateType", clearOnChange: ["plate"] }),
		form_content_node_struct,
	);
});

Deno.test("form_content_node_struct — accepts composite plate variants", () => {
	valid(
		node({
			type: "plate",
			plateVariants: [{
				when: { op: "eq", path: "plateType", value: "ملی" },
				parts: [
					{ key: "a", label: "دو رقم", kind: "digits", length: 2 },
					{
						key: "b",
						label: "حرف",
						kind: "select",
						items: [{ value: "ب", label: "ب" }],
					},
				],
			}],
		}),
		form_content_node_struct,
	);
});

Deno.test("form_content_node_struct — rejects a plate variant with no parts", () => {
	assert(
		rejects(
			node({
				type: "plate",
				plateVariants: [{ when: { op: "always" }, parts: [] }],
			}),
			form_content_node_struct,
		),
	);
});

Deno.test("form_content_node_struct — accepts repeatable bounds", () => {
	valid(
		node({ kind: "repeatable", label: "ردیف", minItems: 1, maxItems: 10 }),
		form_content_node_struct,
	);
});

Deno.test("form_section_struct — requires a key and title", () => {
	valid({ key: "s", title: "بخش", nodes: [node()] }, form_section_struct);
	assert(rejects({ title: "بخش" }, form_section_struct));
	assert(rejects({ key: "s" }, form_section_struct));
});

Deno.test("form_section_struct — a section may omit its nodes", () => {
	// `optional`, not `defaulted`, so `update` (which runs a plain assert) and
	// `add` (which runs create) validate the same document identically.
	valid({ key: "s", title: "بخش" }, form_section_struct);
});

Deno.test("form_page_struct — requires a key and title", () => {
	valid({ key: "p", title: "صفحه", sections: [] }, form_page_struct);
	assert(rejects({ key: "p" }, form_page_struct));
});

Deno.test("form_issue_struct — requires path, node_key, message and severity", () => {
	valid(
		{
			path: "vehicles[0].type",
			node_key: "type",
			message: "الزامی است.",
			severity: "error",
		},
		form_issue_struct,
	);
	assert(
		rejects({ path: "a", node_key: "b", message: "m" }, form_issue_struct),
	);
	assert(
		rejects(
			{ path: "a", node_key: "b", message: "m", severity: "nope" },
			form_issue_struct,
		),
	);
});

Deno.test("every field type the QA form needs is accepted", () => {
	for (
		const type of [
			"text",
			"textarea",
			"number",
			"date",
			"time",
			"datetime",
			"select",
			"multi_select",
			"boolean",
			"choice_group",
			"reference",
			"plate",
			"file",
			"location",
			"computed",
		]
	) {
		valid(node({ type }), form_content_node_struct);
	}
});

Deno.test("an unknown field type is rejected", () => {
	// The engine has no handler for an unknown type, so a typo must fail at
	// authoring time rather than render a blank input in the field.
	assert(rejects(node({ type: "hologram" }), form_content_node_struct));
});

Deno.test("option tone values are constrained", () => {
	valid(
		node({
			options: {
				kind: "literal",
				items: [{ value: "a", label: "a", tone: "danger" }],
			},
		}),
		form_content_node_struct,
	);
	assert(
		rejects(
			node({
				options: {
					kind: "literal",
					items: [{ value: "a", label: "a", tone: "sparkly" }],
				},
			}),
			form_content_node_struct,
		),
	);
});

Deno.test("definition schemaVersion is optional and defaulted downstream", () => {
	valid({ schemaVersion: 1, name: "x", pages: [] }, form_definition_struct);
	valid({ name: "x" }, form_definition_struct);
});

Deno.test("a deeply nested definition still validates", () => {
	// Three levels of repeatable nesting must not hit a depth guard.
	const deep = {
		pages: [{
			key: "p",
			title: "p",
			sections: [{
				key: "s",
				title: "s",
				nodes: [node({
					key: "a",
					kind: "repeatable",
					label: "a",
					children: [node({
						key: "b",
						kind: "repeatable",
						label: "b",
						children: [node({
							key: "c",
							kind: "repeatable",
							label: "c",
							children: [node({ key: "d" })],
						})],
					})],
				})],
			}],
		}],
	};
	valid(deep, form_definition_struct);
});

Deno.test("assertEquals sanity — the fixture is what we think it is", () => {
	assertEquals(qaTree.pages[0].sections[0].nodes.length, 2);
});
