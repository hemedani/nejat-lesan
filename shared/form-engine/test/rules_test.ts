import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { evalRule } from "../src/rules.ts";
import type { AnswerTree, Rule } from "../src/types.ts";

// Mirrors the QA accident form: severity, nested vehicles with drivers and
// passengers, and pedestrians.
const tree: AnswerTree = {
	severity: "خسارتی",
	traffic: "انسداد کامل",
	emergency: ["حریق یا دود شدید", "مصدوم"],
	support: ["آتش‌نشانی", "اورژانس ۱۱۵"],
	hasDamage: "بله",
	count: 3,
	vehicles: [
		{
			type: "سواری",
			mobility: "قابل حرکت",
			driver: { health: "سالم" },
			passengers: [{ health: "مصدوم" }, { health: "سالم" }],
		},
		{
			type: "کامیون",
			mobility: "نیاز به جرثقیل",
			driver: { health: "فوتی در صحنه" },
			passengers: [],
		},
	],
	pedestrians: [{ health: "سالم" }],
	damages: [],
};

const run = (rule: Rule, answers: AnswerTree = tree) => evalRule(rule, answers);

// ---------------------------------------------------------------------------
// Structural
// ---------------------------------------------------------------------------

Deno.test("always is always true", () => {
	assert(run({ op: "always" }));
});

Deno.test("and requires every child", () => {
	const rule: Rule = {
		op: "and",
		rules: [
			{ op: "eq", path: "severity", value: "خسارتی" },
			{ op: "eq", path: "hasDamage", value: "بله" },
		],
	};
	assert(run(rule));
});

Deno.test("and fails when one child fails", () => {
	const rule: Rule = {
		op: "and",
		rules: [
			{ op: "eq", path: "severity", value: "خسارتی" },
			{ op: "eq", path: "hasDamage", value: "خیر" },
		],
	};
	assertEquals(run(rule), false);
});

Deno.test("or requires any child", () => {
	const rule: Rule = {
		op: "or",
		rules: [
			{ op: "eq", path: "hasDamage", value: "خیر" },
			{ op: "eq", path: "hasDamage", value: "بله" },
		],
	};
	assert(run(rule));
});

Deno.test("empty and is true, empty or is false", () => {
	// Vacuous truth keeps a page with no conditions visible.
	assert(run({ op: "and", rules: [] }));
	assertEquals(run({ op: "or", rules: [] }), false);
});

Deno.test("not inverts", () => {
	assertEquals(
		run({ op: "not", rule: { op: "eq", path: "hasDamage", value: "خیر" } }),
		true,
	);
});

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

Deno.test("eq and ne", () => {
	assert(run({ op: "eq", path: "severity", value: "خسارتی" }));
	assertEquals(run({ op: "eq", path: "severity", value: "جرحی" }), false);
	assert(run({ op: "ne", path: "severity", value: "جرحی" }));
});

Deno.test("eq against a missing path is false", () => {
	assertEquals(run({ op: "eq", path: "missing", value: "x" }), false);
});

Deno.test("eq matches when ANY resolved value matches", () => {
	// `vehicles[].type` resolves to two values; matching either is enough.
	assert(run({ op: "eq", path: "vehicles[].type", value: "کامیون" }));
	assert(run({ op: "eq", path: "vehicles[].type", value: "سواری" }));
	assertEquals(
		run({ op: "eq", path: "vehicles[].type", value: "تریلی" }),
		false,
	);
});

Deno.test("in / nin over a resolved list", () => {
	assert(
		run({
			op: "in",
			path: "vehicles[].type",
			value: ["سواری", "کامیون"],
		}),
	);
	assertEquals(
		run({ op: "nin", path: "vehicles[].type", value: ["تریلی"] }),
		true,
	);
});

Deno.test("in against an empty resolved list is false", () => {
	// No damages recorded yet, so nothing can be "in" the damage types.
	assertEquals(
		run({ op: "in", path: "damages[].type", value: ["گاردریل"] }),
		false,
	);
});

Deno.test("contains matches inside a multi-select array", () => {
	assert(
		run({ op: "contains", path: "emergency", value: "مصدوم" }),
	);
	assertEquals(
		run({
			op: "contains",
			path: "emergency",
			value: "واژگونی وسیله سنگین",
		}),
		false,
	);
});

Deno.test("numeric comparisons", () => {
	assert(run({ op: "gt", path: "count", value: 2 }));
	assert(run({ op: "gte", path: "count", value: 3 }));
	assertEquals(run({ op: "lt", path: "count", value: 3 }), false);
	assertEquals(run({ op: "lte", path: "count", value: 3 }), true);
});

Deno.test("numeric comparison against a non-numeric answer is false", () => {
	assertEquals(run({ op: "gt", path: "severity", value: 0 }), false);
});

Deno.test("numeric comparison coerces a numeric string", () => {
	const answers: AnswerTree = { count: "5" };
	assert(evalRule({ op: "gt", path: "count", value: 3 }, answers));
});

Deno.test("boolean comparison", () => {
	const answers: AnswerTree = { hasDamage: true, note: "" };
	assert(evalRule({ op: "eq", path: "hasDamage", value: true }, answers));
	assertEquals(
		evalRule({ op: "eq", path: "note", value: true }, answers),
		false,
	);
});

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

Deno.test("exists / empty / filled", () => {
	const answers: AnswerTree = {
		a: "متن",
		b: "",
		c: [],
		d: { e: "1" },
		f: 0,
	};
	assert(evalRule({ op: "exists", path: "a" }, answers));
	assertEquals(evalRule({ op: "exists", path: "zzz" }, answers), false);

	assertEquals(evalRule({ op: "empty", path: "b" }, answers), true);
	assertEquals(evalRule({ op: "empty", path: "c" }, answers), true);
	// 0 is a real answer, not an empty one.
	assertEquals(evalRule({ op: "empty", path: "f" }, answers), false);

	assert(evalRule({ op: "filled", path: "d" }, answers));
	assertEquals(evalRule({ op: "filled", path: "b" }, answers), false);
});

Deno.test("filled on a repeatable means it has at least one row", () => {
	assert(evalRule({ op: "filled", path: "vehicles" }, tree));
	// An empty group must not satisfy a requiredness check.
	assertEquals(evalRule({ op: "filled", path: "damages" }, tree), false);
});

Deno.test("filled is false when the repeatable key is absent", () => {
	const answers: AnswerTree = { severity: "جرحی" };
	assertEquals(evalRule({ op: "filled", path: "vehicles" }, answers), false);
});

// ---------------------------------------------------------------------------
// Cross-item aggregates — what makes the QA warnings expressible
// ---------------------------------------------------------------------------

Deno.test("anyIn over a nested repeatable", () => {
	const casualties = ["مصدوم", "فوتی در صحنه"];
	// Vehicle 1's passenger 1 is مصدوم.
	assert(
		run({
			op: "anyIn",
			path: "vehicles[].passengers[].health",
			value: casualties,
		}),
	);
	// Vehicle 2's driver is فوتی در صحنه.
	assert(
		run({
			op: "anyIn",
			path: "vehicles[].driver.health",
			value: casualties,
		}),
	);
});

Deno.test("anyIn over pedestrians finds nothing when all are unharmed", () => {
	// The only pedestrian is سالم, so a casualty check must not fire.
	assertEquals(
		run({
			op: "anyIn",
			path: "pedestrians[].health",
			value: ["مصدوم", "فوتی در صحنه"],
		}),
		false,
	);
});

Deno.test("anyIn over pedestrians fires when one is a casualty", () => {
	const hurt: AnswerTree = {
		...tree,
		pedestrians: [{ health: "سالم" }, { health: "مصدوم" }],
	};
	assert(
		evalRule(
			{
				op: "anyIn",
				path: "pedestrians[].health",
				value: ["مصدوم", "فوتی در صحنه"],
			},
			hurt,
		),
	);
});

Deno.test("anyIn is false when nothing matches", () => {
	const answers: AnswerTree = {
		vehicles: [{ driver: { health: "سالم" } }],
		pedestrians: [{ health: "سالم" }],
	};
	assertEquals(
		evalRule(
			{
				op: "anyIn",
				path: "vehicles[].driver.health",
				value: ["مصدوم", "فوتی در صحنه"],
			},
			answers,
		),
		false,
	);
});

Deno.test("anyIn over an empty group is false", () => {
	assertEquals(
		run({ op: "anyIn", path: "damages[].type", value: ["گاردریل"] }),
		false,
	);
});

Deno.test("everyIn over a nested repeatable", () => {
	assert(
		run({
			op: "everyIn",
			path: "vehicles[].driver.health",
			value: ["سالم", "مصدوم", "فوتی در صحنه"],
		}),
	);
	assertEquals(
		run({
			op: "everyIn",
			path: "vehicles[].driver.health",
			value: ["سالم"],
		}),
		false,
	);
});

Deno.test("everyIn over an empty group is true (nothing violates it)", () => {
	// No vehicles means no vehicle violates the constraint — this is what lets an
	// optional group stay valid while empty.
	assertEquals(
		run({ op: "everyIn", path: "damages[].type", value: ["گاردریل"] }),
		true,
	);
});

Deno.test("someTrue / someFalse", () => {
	const answers: AnswerTree = {
		vehicles: [
			{ checked: true },
			{ checked: false },
			{ checked: true },
		],
		empty: [],
	};
	assert(evalRule({ op: "someTrue", path: "vehicles[].checked" }, answers));
	assert(evalRule({ op: "someFalse", path: "vehicles[].checked" }, answers));
	assertEquals(
		evalRule({ op: "someTrue", path: "empty[].checked" }, answers),
		false,
	);
	assertEquals(
		evalRule({ op: "someFalse", path: "empty[].checked" }, answers),
		false,
	);
});

// ---------------------------------------------------------------------------
// count
// ---------------------------------------------------------------------------

Deno.test("count with gte / lte", () => {
	assert(run({ op: "count", path: "vehicles", gte: 2 }));
	assert(run({ op: "count", path: "vehicles", lte: 2 }));
	assertEquals(run({ op: "count", path: "vehicles", gte: 3 }), false);
	// At least one vehicle is required by the QA form.
	assert(run({ op: "count", path: "vehicles", gte: 1 }));
});

Deno.test("count across a nested repeatable", () => {
	assert(run({ op: "count", path: "vehicles[].passengers[]", gte: 2 }));
	assertEquals(
		run({ op: "count", path: "vehicles[].passengers[]", gte: 3 }),
		false,
	);
});

Deno.test("count on an empty group", () => {
	assert(run({ op: "count", path: "damages[]", gte: 0 }));
	assertEquals(run({ op: "count", path: "damages[]", gte: 1 }), false);
});

Deno.test("count with neither bound is false", () => {
	// A bound-less count cannot assert anything; treat as unsatisfied rather than
	// silently passing a rule the author meant to be meaningful.
	assertEquals(run({ op: "count", path: "vehicles" }), false);
});

// ---------------------------------------------------------------------------
// Depth — the QA form's heaviest warning, end to end
// ---------------------------------------------------------------------------

Deno.test("QA warning — damage-only severity but a casualty exists", () => {
	const rule: Rule = {
		op: "and",
		rules: [
			{ op: "eq", path: "severity", value: "خسارتی" },
			{
				op: "or",
				rules: [
					{
						op: "anyIn",
						path: "vehicles[].driver.health",
						value: ["مصدوم", "فوتی در صحنه"],
					},
					{
						op: "anyIn",
						path: "vehicles[].passengers[].health",
						value: ["مصدوم", "فوتی در صحنه"],
					},
					{
						op: "anyIn",
						path: "pedestrians[].health",
						value: ["مصدوم", "فوتی در صحنه"],
					},
				],
			},
		],
	};
	assert(run(rule));
});

Deno.test("QA warning — no false positive when everyone is unharmed", () => {
	const safe: AnswerTree = {
		severity: "خسارتی",
		vehicles: [{
			driver: { health: "سالم" },
			passengers: [{ health: "سالم" }],
		}],
		pedestrians: [{ health: "سالم" }],
	};
	assertEquals(
		evalRule(
			{
				op: "and",
				rules: [
					{ op: "eq", path: "severity", value: "خسارتی" },
					{
						op: "anyIn",
						path: "vehicles[].passengers[].health",
						value: ["مصدوم"],
					},
				],
			},
			safe,
		),
		false,
	);
});

Deno.test("QA visibility — damages shown only when damage is confirmed", () => {
	const rule: Rule = { op: "eq", path: "hasDamage", value: "بله" };
	assert(run(rule));
	assertEquals(
		evalRule(rule, { ...tree, hasDamage: "خیر" }),
		false,
	);
});

Deno.test("QA derived support — fire or explosion implies fire services", () => {
	// Mirrors the reference app's `suggestions()`.
	const rule: Rule = {
		op: "anyIn",
		path: "emergency",
		value: ["حریق یا دود شدید", "خطر انفجار"],
	};
	assert(run(rule));
	assertEquals(
		evalRule(rule, { ...tree, emergency: ["مصدوم"] }),
		false,
	);
});

Deno.test("QA warning — crane needed but crane not requested", () => {
	const rule: Rule = {
		op: "and",
		rules: [
			{
				op: "anyIn",
				path: "vehicles[].mobility",
				value: ["نیاز به جرثقیل"],
			},
			{
				op: "not",
				rule: { op: "contains", path: "support", value: "جرثقیل" },
			},
		],
	};
	assert(run(rule));
	assertEquals(
		evalRule(rule, { ...tree, support: ["جرثقیل", "اورژانس ۱۱۵"] }),
		false,
	);
});

// ---------------------------------------------------------------------------
// Robustness — a malformed rule must not crash a patrol officer's screen
// ---------------------------------------------------------------------------

Deno.test("an unknown op is false, not a throw", () => {
	assertEquals(
		evalRule({ op: "exec" } as unknown as Rule, tree),
		false,
	);
});

Deno.test("and/or/not with a missing child is false, not a throw", () => {
	assertEquals(
		run({ op: "and", rules: [undefined as unknown as Rule] }),
		false,
	);
	assertEquals(
		run({ op: "not", rule: undefined as unknown as Rule }),
		true,
	);
});

Deno.test("an empty path resolves to nothing rather than throwing", () => {
	assertEquals(run({ op: "eq", path: "", value: "x" }), false);
});

Deno.test("deeply nested rules do not blow the stack on realistic depth", () => {
	let rule: Rule = { op: "eq", path: "severity", value: "خسارتی" };
	for (let i = 0; i < 40; i++) rule = { op: "not", rule };
	assert(run(rule));
});
