import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import {
	isNodeRequired,
	isNodeVisible,
	resolveOptions,
	visiblePages,
} from "../src/conditions.ts";
import type {
	AnswerTree,
	FieldNode,
	FormDefinition,
	OptionItem,
	OptionSource,
} from "../src/types.ts";
import { DEFAULT_SCHEMA_VERSION } from "../src/types.ts";

const f = (partial: Partial<FieldNode> & { key: string }): FieldNode => ({
	kind: "field",
	type: "text",
	label: partial.key,
	order: 0,
	...partial,
} as FieldNode);

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

Deno.test("isNodeVisible — a node with no rule is always visible", () => {
	assertEquals(isNodeVisible(f({ key: "a" }), { severity: "جرحی" }), true);
});

Deno.test("isNodeVisible — honours visibleWhen", () => {
	const node = f({
		key: "cargo",
		visibleWhen: { op: "eq", path: "category", value: "heavy" },
	});
	assertEquals(isNodeVisible(node, { category: "heavy" }), true);
	assertEquals(isNodeVisible(node, { category: "car" }), false);
	assertEquals(isNodeVisible(node, {}), false);
});

Deno.test("isNodeVisible — respects the row scope inside a repeatable", () => {
	const node = f({
		key: "cargo",
		visibleWhen: { op: "eq", path: "type", value: "کامیون" },
	});
	assertEquals(
		isNodeVisible(node, {}, [{ type: "کامیون" }]),
		true,
	);
	assertEquals(
		isNodeVisible(node, {}, [{ type: "سواری" }]),
		false,
	);
});

// ---------------------------------------------------------------------------
// Requiredness
// ---------------------------------------------------------------------------

Deno.test("isNodeRequired — optional by default", () => {
	assertEquals(isNodeRequired(f({ key: "a" }), {}), false);
});

Deno.test("isNodeRequired — requiredWhen always", () => {
	const node = f({ key: "a", requiredWhen: { op: "always" } });
	assertEquals(isNodeRequired(node, {}), true);
});

Deno.test("isNodeRequired — conditional on another answer", () => {
	// The QA form: driver documents are required only when the officer says the
	// documents are available.
	const node = f({
		key: "documents",
		requiredWhen: { op: "eq", path: "documentsAvailable", value: "بله" },
	});
	assertEquals(isNodeRequired(node, { documentsAvailable: "بله" }), true);
	assertEquals(isNodeRequired(node, { documentsAvailable: "خیر" }), false);
	assertEquals(isNodeRequired(node, {}), false);
});

Deno.test("isNodeRequired — an invisible node is never required", () => {
	const node = f({
		key: "cargo",
		visibleWhen: { op: "eq", path: "heavy", value: true },
		requiredWhen: { op: "always" },
	});
	// Hidden ⇒ nothing to fill in, so it must not block the officer.
	assertEquals(isNodeRequired(node, { heavy: false }), false);
	assertEquals(isNodeRequired(node, { heavy: true }), true);
});

// ---------------------------------------------------------------------------
// Option resolution — the "options change" requirement
// ---------------------------------------------------------------------------

const allItems: OptionItem[] = [
	{ value: "سواری", label: "سواری" },
	{ value: "کامیون", label: "کامیون" },
	{ value: "تریلی", label: "تریلی" },
	{ value: "تانکر حمل مواد خطرناک", label: "تانکر حمل مواد خطرناک" },
];

const heavy: OptionSource = { kind: "literal", items: allItems };

Deno.test("resolveOptions — literal source returns every item", () => {
	assertEquals(
		resolveOptions({ options: heavy }, {}).map((o) => o.value),
		["سواری", "کامیون", "تریلی", "تانکر حمل مواد خطرناک"],
	);
});

Deno.test("resolveOptions — a field with no options returns an empty list", () => {
	assertEquals(resolveOptions({}, {}), []);
});

Deno.test("resolveOptions — static optionsFilter narrows to a fixed list", () => {
	const node = f({
		key: "type",
		options: heavy,
		optionsFilter: { mode: "static", values: ["کامیون", "تریلی"] },
	});
	assertEquals(resolveOptions(node, {}).map((o) => o.value), [
		"کامیون",
		"تریلی",
	]);
});

Deno.test("resolveOptions — dynamic optionsFilter narrows by another answer", () => {
	// Show cargo-bearing vehicle types only when a hazard switch is on.
	const node = f({
		key: "type",
		options: heavy,
		optionsFilter: {
			mode: "dynamic",
			rule: { op: "in", path: "hazmat", value: ["بله"] },
			values: ["تانکر حمل مواد خطرناک"],
		},
	});
	assertEquals(
		resolveOptions(node, { hazmat: "بله" }).map((o) => o.value),
		["تانکر حمل مواد خطرناک"],
	);
	assertEquals(resolveOptions(node, { hazmat: "خیر" }), []);
});

Deno.test("resolveOptions — an unmatched filter is not a silent pass-through", () => {
	const node = f({
		key: "type",
		options: heavy,
		optionsFilter: {
			mode: "dynamic",
			rule: { op: "eq", path: "category", value: "bus" },
			values: ["سواری"],
		},
	});
	// Nothing matches the filter, so the officer sees no options rather than the
	// full list — a visible "no options" beats a misleading dropdown.
	assertEquals(resolveOptions(node, { category: "car" }), []);
});

Deno.test("resolveOptions — preserves tone, symbol and recommended flags", () => {
	const node = f({
		key: "traffic",
		options: {
			kind: "literal",
			items: [
				{
					value: "انسداد کامل",
					label: "انسداد کامل",
					tone: "danger",
					symbol: "⊖",
				},
				{ value: "عادی", label: "عادی", recommended: true },
			],
		},
	});
	const items = resolveOptions(node, {});
	assertEquals(items[0].tone, "danger");
	assertEquals(items[0].symbol, "⊖");
	assertEquals(items[1].recommended, true);
});

Deno.test("resolveOptions — reference source is resolved by the caller", () => {
	// The engine must not invent backend ids offline; it returns the descriptor
	// so the client can merge cached options.
	const node = f({
		key: "collisionTypeId",
		options: {
			kind: "reference",
			model: "collision_type",
			allowedIds: ["a", "b"],
		},
	});
	assertEquals(resolveOptions(node, {}), []);
});

Deno.test("resolveOptions — scoped filter sees the row's own answers", () => {
	const node = f({
		key: "support",
		options: {
			kind: "literal",
			items: [{ value: "جرثقیل", label: "جرثقیل" }],
		},
		optionsFilter: {
			mode: "dynamic",
			rule: { op: "eq", path: "mobility", value: "نیاز به جرثقیل" },
			values: ["جرثقیل"],
		},
	});
	assertEquals(
		resolveOptions(node, {}, [{ mobility: "نیاز به جرثقیل" }]).map((o) =>
			o.value
		),
		["جرثقیل"],
	);
});

// ---------------------------------------------------------------------------
// Page visibility — a conditional section removes the step from the wizard
// ---------------------------------------------------------------------------

const definition: FormDefinition = {
	schemaVersion: DEFAULT_SCHEMA_VERSION,
	name: "گزارش",
	pages: [
		{
			key: "location",
			title: "موقعیت",
			order: 1,
			sections: [],
		},
		{
			key: "damage",
			title: "آسیب تجهیزات",
			order: 2,
			// Only collected when the officer confirms road-equipment damage.
			visibleWhen: { op: "eq", path: "hasDamage", value: "بله" },
			sections: [],
		},
		{
			key: "review",
			title: "بازبینی",
			order: 3,
			sections: [],
		},
	],
};

Deno.test("visiblePages — hides a conditional page", () => {
	const keys = visiblePages(definition, { hasDamage: "خیر" }).map((p) =>
		p.key
	);
	assertEquals(keys, ["location", "review"]);
});

Deno.test("visiblePages — shows a conditional page once its condition holds", () => {
	const keys = visiblePages(definition, { hasDamage: "بله" }).map((p) =>
		p.key
	);
	assertEquals(keys, ["location", "damage", "review"]);
});

Deno.test("visiblePages — keeps declaration order", () => {
	const keys = visiblePages(definition, { hasDamage: "بله" }).map((p) =>
		p.title
	);
	assertEquals(keys, ["موقعیت", "آسیب تجهیزات", "بازبینی"]);
});

Deno.test("visiblePages — an unconditional definition keeps every page", () => {
	const keys = visiblePages(definition, {}).map((p) => p.key);
	assertEquals(keys, ["location", "review"]);
});
