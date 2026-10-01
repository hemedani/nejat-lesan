import { describe, expect, it } from "vitest";
import { evalRule, validateForm, visiblePages } from "@forms";
import type { AnswerTree, FormDefinition } from "@forms";

/**
 * Offline parity checks for the shared form engine.
 *
 * These deliberately re-assert the QA form's hardest conditions here. The point
 * is that mobile evaluates rules with the *same* code the backend uses at submit
 * time — if the offline answer to "is this field visible?" ever disagrees with
 * the server's, an officer files a report the backend rejects.
 */

const accidentDefinition: FormDefinition = {
	schemaVersion: 1,
	name: "گزارش تصادف آزادراه",
	pages: [
		{
			key: "emergency",
			title: "اقدامات فوری",
			order: 1,
			sections: [
				{
					key: "emergencySection",
					title: "وضعیت صحنه",
					order: 1,
					nodes: [
						{
							kind: "field",
							key: "emergency",
							type: "multi_select",
							label: "وضعیت‌های اضطراری",
							order: 1,
							options: {
								kind: "literal",
								items: [
									{ value: "حریق یا دود شدید", label: "حریق یا دود شدید", tone: "danger" },
									{ value: "مصدوم", label: "مصدوم", tone: "warn" },
									{ value: "واژگونی وسیله سنگین", label: "واژگونی وسیله سنگین" },
								],
							},
						},
					],
				},
			],
		},
		{
			key: "support",
			title: "نیاز به پشتیبانی",
			order: 2,
			// The support step only appears when the officer actually requests help.
			visibleWhen: {
				op: "anyIn",
				path: "emergency",
				value: [
					"حریق یا دود شدید",
					"مصدوم",
					"واژگونی وسیله سنگین",
				],
			},
			sections: [
				{
					key: "supportSection",
					title: "پشتیبانی",
					order: 1,
					nodes: [
						{
							kind: "field",
							key: "support",
							type: "multi_select",
							label: "پشتیبانی مورد نیاز",
							order: 1,
							options: {
								kind: "literal",
								items: [
									{ value: "اورژانس ۱۱۵", label: "اورژانس ۱۱۵" },
									{ value: "آتش‌نشانی", label: "آتش‌نشانی" },
									{ value: "جرثقیل", label: "جرثقیل" },
								],
							},
						},
					],
				},
			],
		},
	],
};

describe("shared engine — offline rule evaluation", () => {
	it("hides a conditional page when its condition does not hold", () => {
		const answers: AnswerTree = { emergency: [] };
		expect(visiblePages(accidentDefinition, answers).map((p) => p.key)).toEqual([
			"emergency",
		]);
	});

	it("reveals a conditional page when its condition holds", () => {
		const answers: AnswerTree = { emergency: ["مصدوم"] };
		expect(visiblePages(accidentDefinition, answers).map((p) => p.key)).toEqual([
			"emergency",
			"support",
		]);
	});

	it("evaluates anyIn over a multi-select without network access", () => {
		expect(
			evalRule(
				{
					op: "anyIn",
					path: "emergency",
					value: ["حریق یا دود شدید", "خطر انفجار"],
				},
				{ emergency: ["حریق یا دود شدید"] },
			),
		).toBe(true);

		expect(
			evalRule(
				{
					op: "anyIn",
					path: "emergency",
					value: ["حریق یا دود شدید"],
				},
				{ emergency: ["مصدوم"] },
			),
		).toBe(false);
	});

	it("never treats an unanswered repeatable as satisfied", () => {
		const definition: FormDefinition = {
			schemaVersion: 1,
			name: "x",
			pages: [
				{
					key: "p",
					title: "p",
					order: 1,
					sections: [
						{
							key: "s",
							title: "s",
							order: 1,
							nodes: [
								{
									kind: "repeatable",
									key: "vehicles",
									label: "وسایل نقلیه",
									order: 1,
									minItems: 1,
									children: [],
								},
							],
						},
					],
				},
			],
		};
		expect(validateForm(definition, { vehicles: [] }).errors.length).toBe(1);
		expect(validateForm(definition, { vehicles: [{ x: 1 }] }).errors).toEqual([]);
	});
});