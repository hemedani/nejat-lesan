import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { validateForm } from "../src/validate.ts";
import type { AnswerTree, FormDefinition } from "../src/types.ts";
import { DEFAULT_SCHEMA_VERSION } from "../src/types.ts";
import type { FieldNode } from "../src/types.ts";

const f = (partial: Partial<FieldNode> & { key: string }): FieldNode => ({
	kind: "field",
	type: "text",
	label: partial.key,
	order: 0,
	...partial,
} as FieldNode);

/**
 * A miniature version of the QA form's step-5 shape: at least one vehicle, each
 * with a type, plus the cross-item crane warning.
 */
const definition: FormDefinition = {
	schemaVersion: DEFAULT_SCHEMA_VERSION,
	name: "گزارش تصادف",
	pages: [
		{
			key: "vehiclesPage",
			title: "وسایل نقلیه",
			order: 1,
			sections: [
				{
					key: "vehiclesSection",
					title: "وسایل",
					order: 1,
					requiredWhen: { op: "always" },
					nodes: [
						{
							kind: "repeatable",
							key: "vehicles",
							label: "وسیله نقلیه",
							order: 1,
							minItems: 1,
							requiredWhen: { op: "always" },
							children: [
								f({
									key: "type",
									label: "نوع وسیله نقلیه",
									requiredWhen: { op: "always" },
								}),
								f({ key: "mobility", label: "وضعیت جابه‌جایی" }),
								{
									kind: "repeatable",
									key: "passengers",
									label: "سرنشین",
									order: 1,
									children: [
										f({
											key: "health",
											label: "وضعیت فرد",
											requiredWhen: { op: "always" },
										}),
									],
								},
							],
						},
						{
							kind: "field",
							key: "support",
							type: "multi_select",
							label: "پشتیبانی",
							order: 2,
							options: {
								kind: "literal",
								items: [
									{ value: "جرثقیل", label: "جرثقیل" },
									{ value: "یدک‌کش", label: "یدک‌کش" },
								],
							},
							validation: {
								warnings: [
									{
										rule: {
											op: "and",
											rules: [
												{
													op: "anyIn",
													path: "vehicles[].mobility",
													value: ["نیاز به جرثقیل"],
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
										message:
											"وسیله نیاز به جرثقیل دارد اما این پشتیبانی انتخاب نشده است.",
									},
								],
							},
						},
					],
				},
			],
		},
		{
			key: "reviewPage",
			title: "بازبینی",
			order: 2,
			sections: [],
		},
	],
};

const messages = (issues: Array<{ message: string }>) =>
	issues.map((i) => i.message);

// ---------------------------------------------------------------------------
// Requiredness
// ---------------------------------------------------------------------------

Deno.test("validateForm — an empty report blocks on the empty repeatable", () => {
	const result = validateForm(definition, {});
	assert(result.errors.length > 0);
	assert(result.blockedPages.includes("vehiclesPage"));
});

Deno.test("validateForm — a complete report has no errors", () => {
	const result = validateForm(definition, {
		vehicles: [{ type: "سواری", mobility: "قابل حرکت", passengers: [] }],
	});
	assertEquals(result.errors, []);
	assertEquals(result.blockedPages, []);
});

Deno.test("validateForm — a missing required field is reported once, with its row path", () => {
	const result = validateForm(definition, {
		vehicles: [{ type: "سواری", passengers: [] }, {
			mobility: "قابل حرکت",
		}],
	});
	// Only the second vehicle is missing `type`; the first must not be re-reported.
	assertEquals(messages(result.errors), ["وسیله نقلیه: نوع وسیله نقلیه"]);
	assertEquals(result.errors[0].path, "vehicles[1].type");
});

Deno.test("validateForm — required fields inside nested repeatables", () => {
	const result = validateForm(definition, {
		vehicles: [
			{ type: "سواری", passengers: [{ health: "سالم" }, {}] },
		],
	});
	assertEquals(messages(result.errors), ["سرنشین: وضعیت فرد"]);
	assertEquals(result.errors[0].path, "vehicles[0].passengers[1].health");
});

Deno.test("validateForm — a hidden required field does not block", () => {
	// The QA form only asks for `cargo` on heavy vehicles.
	const conditional: FormDefinition = {
		...definition,
		pages: [
			{
				key: "p",
				title: "p",
				order: 1,
				sections: [{
					key: "s",
					title: "s",
					order: 1,
					nodes: [
						f({
							key: "cargo",
							label: "نوع بار",
							visibleWhen: {
								op: "anyIn",
								path: "vehicles[].type",
								value: ["کامیون", "تریلی"],
							},
							requiredWhen: { op: "always" },
						}),
					],
				}],
			} as FormDefinition["pages"][number],
		],
	};
	// No heavy vehicles, so the cargo question never appears.
	assertEquals(
		validateForm(conditional, { vehicles: [{ type: "سواری" }] }).errors,
		[],
	);
	// A heavy vehicle appears, so cargo becomes visible and required.
	assertEquals(
		messages(
			validateForm(conditional, { vehicles: [{ type: "کامیون" }] })
				.errors,
		),
		["نوع بار الزامی است."],
	);
});

// ---------------------------------------------------------------------------
// Warnings — advisory, never blocking
// ---------------------------------------------------------------------------

Deno.test("validateForm — the crane mismatch is a warning, not an error", () => {
	const result = validateForm(definition, {
		vehicles: [{
			type: "کامیون",
			mobility: "نیاز به جرثقیل",
			passengers: [],
		}],
	});
	assertEquals(result.errors, []);
	assertEquals(messages(result.warnings), [
		"وسیله نیاز به جرثقیل دارد اما این پشتیبانی انتخاب نشده است.",
	]);
	assertEquals(result.blockedPages, []);
});

Deno.test("validateForm — the crane warning clears once support includes it", () => {
	const result = validateForm(definition, {
		vehicles: [{
			type: "کامیون",
			mobility: "نیاز به جرثقیل",
			passengers: [],
		}],
		support: ["جرثقیل"],
	});
	assertEquals(result.warnings, []);
});

Deno.test("validateForm — warnings carry the field they hang off", () => {
	const result = validateForm(definition, {
		vehicles: [{
			type: "کامیون",
			mobility: "نیاز به جرثقیل",
			passengers: [],
		}],
	});
	assertEquals(result.warnings[0].nodeKey, "support");
	assertEquals(result.warnings[0].path, "support");
	assertEquals(result.warnings[0].severity, "warning");
});

// ---------------------------------------------------------------------------
// Scalar constraints
// ---------------------------------------------------------------------------

Deno.test("validateForm — minLength / maxLength", () => {
	const withLength: FormDefinition = {
		...definition,
		pages: [
			{
				key: "p",
				title: "p",
				order: 1,
				sections: [{
					key: "s",
					title: "s",
					order: 1,
					nodes: [
						f({
							key: "note",
							label: "توضیحات",
							validation: {
								minLength: 5,
								maxLength: 10,
								message: "توضیحات باید بین ۵ تا ۱۰ نویسه باشد.",
							},
						}),
					],
				}],
			} as FormDefinition["pages"][number],
		],
	};
	assertEquals(
		messages(validateForm(withLength, { note: "ab" }).errors),
		["توضیحات باید بین ۵ تا ۱۰ نویسه باشد."],
	);
	assertEquals(
		validateForm(withLength, { note: "abcdefghijk" }).errors.length,
		1,
	);
	assertEquals(validateForm(withLength, { note: "abcdefghij" }).errors, []);
});

Deno.test("validateForm — numeric min / max", () => {
	const withNumber: FormDefinition = {
		...definition,
		pages: [
			{
				key: "p",
				title: "p",
				order: 1,
				sections: [{
					key: "s",
					title: "s",
					order: 1,
					nodes: [
						f({
							key: "count",
							type: "number",
							label: "تعداد",
							validation: {
								min: 1,
								max: 5,
								message: "تعداد باید بین ۱ تا ۵ باشد.",
							},
						}),
					],
				}],
			} as FormDefinition["pages"][number],
		],
	};
	assertEquals(
		messages(validateForm(withNumber, { count: 9 }).errors),
		["تعداد باید بین ۱ تا ۵ باشد."],
	);
	// Persian digits are coerced, matching how the UI presents numbers.
	assertEquals(validateForm(withNumber, { count: "۳" }).errors, []);
});

Deno.test("validateForm — minItems / maxItems on a repeatable", () => {
	const limited: FormDefinition = {
		...definition,
		pages: [
			{
				key: "p",
				title: "p",
				order: 1,
				sections: [{
					key: "s",
					title: "s",
					order: 1,
					nodes: [
						{
							kind: "repeatable",
							key: "rows",
							label: "ردیف‌ها",
							order: 1,
							maxItems: 2,
							children: [f({ key: "v", label: "مقدار" })],
						},
					],
				}],
			} as FormDefinition["pages"][number],
		],
	};
	const three = validateForm(limited, {
		rows: [{ v: "a" }, { v: "b" }, { v: "c" }],
	});
	assertEquals(three.errors.length, 1);
	assertEquals(messages(three.errors), ["حداکثر 2 مورد ثبت کنید."]);
	assertEquals(validateForm(limited, { rows: [{ v: "a" }] }).errors, []);
});

Deno.test("validateForm — an option outside the narrowed set is rejected", () => {
	// The officer can only pick heavy vehicles while a hazard switch is on, so a
	// stale "سواری" answer must not survive silently.
	const narrowed: FormDefinition = {
		...definition,
		pages: [
			{
				key: "p",
				title: "p",
				order: 1,
				sections: [{
					key: "s",
					title: "s",
					order: 1,
					nodes: [
						f({
							key: "type",
							label: "نوع",
							options: {
								kind: "literal",
								items: [
									{ value: "سواری", label: "سواری" },
									{ value: "تانکر", label: "تانکر" },
								],
							},
							optionsFilter: {
								mode: "dynamic",
								rule: {
									op: "eq",
									path: "hazmat",
									value: "بله",
								},
								values: ["تانکر"],
							},
							validation: {
								message: "گزینه انتخابی معتبر نیست.",
							},
						}),
					],
				}],
			} as FormDefinition["pages"][number],
		],
	};
	assertEquals(
		messages(
			validateForm(narrowed, { hazmat: "بله", type: "سواری" }).errors,
		),
		["گزینه انتخابی معتبر نیست."],
	);
	assertEquals(
		validateForm(narrowed, { hazmat: "بله", type: "تانکر" }).errors,
		[],
	);
});

// ---------------------------------------------------------------------------
// Page gating
// ---------------------------------------------------------------------------

Deno.test("validateForm — only the page holding an error is blocked", () => {
	const withSecondPage: FormDefinition = {
		...definition,
		pages: [...definition.pages, {
			key: "notesPage",
			title: "توضیحات",
			order: 2,
			sections: [{
				key: "notesSection",
				title: "توضیحات",
				order: 1,
				nodes: [f({ key: "finalNotes", label: "توضیحات نهایی" })],
			}],
		}],
	};
	const result = validateForm(withSecondPage, { finalNotes: "یادداشت" });
	// Vehicles are empty, so only the vehicles page blocks.
	assertEquals(result.blockedPages, ["vehiclesPage"]);
});

// ---------------------------------------------------------------------------
// Robustness
// ---------------------------------------------------------------------------

Deno.test("validateForm — a malformed definition does not throw", () => {
	const broken = {
		schemaVersion: 1,
		name: "broken",
		pages: [{
			key: "p",
			title: "p",
			order: 1,
			sections: [{
				key: "s",
				title: "s",
				order: 1,
				nodes: [{
					kind: "field",
					key: "x",
					type: "text",
					label: "x",
					order: 0,
					requiredWhen: { op: "bogus" } as never,
					validation: {
						warnings: [{ rule: undefined as never, message: "بد" }],
					},
				}],
			}],
		}],
	} as unknown as FormDefinition;
	assertEquals(validateForm(broken, {}).errors.length, 0);
});

Deno.test("validateForm — a non-object answer is treated as unanswered", () => {
	const result = validateForm(definition, { vehicles: "nonsense" } as never);
	// Falls back to "no rows", which trips the minItems rule rather than crashing.
	assert(result.errors.length > 0);
});
