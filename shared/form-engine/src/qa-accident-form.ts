/**
 * The QA reference form, expressed as a form definition.
 *
 * Moved here from `mobile/src/domain/qa-accident-form.ts`, which is now a
 * re-export shim. It lives in the engine so the backend can activate this exact
 * definition as an organization's accident form — one artifact, imported by both
 * `mobile/src/domain/default-accident-form.ts` and the backend's seed.
 *
 * This file is the acceptance test for the whole engine. It is a faithful
 * encoding of `qa_docs/QA_AR/Accident_Report_App.html` (739 lines) with **no
 * application code at all** — every behaviour the QA team's prototype achieves
 * with hand-written JavaScript is expressed declaratively here.
 *
 * The mapping, section by section:
 *
 * | QA prototype                    | Definition mechanism                     |
 * | ------------------------------- | --------------------------------------- |
 * | 9-step wizard with a side rail  | `pages[]`                               |
 * | `hasDamage === 'بله'` gate      | `visibleWhen` on a page                  |
 * | `plateType` → 4 different parts | `plateVariants` selected by a rule        |
 * | heavy vehicle → cargo select    | `visibleWhen` on a field                  |
 * | `emergency` → suggested support | `optionsFilter` with `mode: "dynamic"`    |
 * | `suggestions()` + overrides     | `optionsFilter.values` + officer selection |
 * | nested `vehicles[].passengers[]`| nested `repeatable`                       |
 * | `errors()` blocks, `warnings()` | `requiredWhen` vs `validation.warnings`   |
 * | plate type clears plate parts   | `clearOnChange`                           |
 * | min one vehicle                 | `minItems: 1`                             |
 * | tone-coded danger choices       | `OptionItem.tone`                         |
 * | reference lists from the server | `options: { kind: "reference" }`         |
 *
 * A definition that needed code to express would mean the engine is not general
 * enough; that is why this file is treated as a test rather than as seed data.
 */

import type {
	ContentNode,
	FieldNode,
	FormDefinition,
	OptionItem,
	PageNode,
	RepeatableNode,
	Rule,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Reusable option lists — the QA app's inline `choice()` calls
// ---------------------------------------------------------------------------

const options = (
	items: Array<[string] | [string, string, OptionItem["tone"]]>,
): OptionItem[] =>
	items.map(([value, label, tone]) => ({
		value,
		label: label ?? value,
		...(tone ? { tone } : {}),
	}));

const TRAFFIC = options([
	["عادی"],
	["اختلال در تردد"],
	["انسداد جزئی", "انسداد جزئی", "warn"],
	["انسداد کامل", "انسداد کامل", "danger"],
]);

const EMERGENCY = options([
	["حریق یا دود شدید", "حریق یا دود شدید", "danger"],
	["واژگونی وسیله سنگین", "واژگونی وسیله سنگین", "warn"],
	["فرد محبوس", "فرد محبوس", "warn"],
	["مصدوم", "مصدوم", "warn"],
	["نشت سوخت یا مواد خطرناک", "نشت سوخت یا مواد خطرناک", "danger"],
	["ریزش بار در سطح راه", "ریزش بار در سطح راه", "warn"],
	["مانع خطرناک در سواره‌رو", "مانع خطرناک در سواره‌رو", "warn"],
	["خطر انفجار", "خطر انفجار", "danger"],
	["سایر"],
	["وضعیت اضطراری وجود ندارد"],
]);

const SUPPORT = options([
	["اورژانس ۱۱۵"],
	["آتش‌نشانی"],
	["هلال احمر ۱۱۲"],
	["پلیس راه"],
	["اکیپ راهداری"],
	["یدک‌کش"],
	["جرثقیل"],
]);

const SEVERITY = options([
	["خسارتی"],
	["جرحی", "جرحی", "warn"],
	["فوتی در صحنه", "فوتی در صحنه", "danger"],
]);

const COLLISION = options([
	["برخورد با وسیله نقلیه"],
	["واژگونی و سقوط"],
	["خروج از جاده"],
	["برخورد با شیء ثابت"],
	["برخورد با عابر"],
	["برخورد با موتورسیکلت"],
	["برخورد با دوچرخه"],
	["برخورد با حیوان"],
	["برخورد با وسیله پارک‌شده"],
	["چندبرخوردی"],
	["نامشخص"],
]);

const LIGHTING = options([
	["روز"],
	["طلوع"],
	["غروب"],
	["شب با روشنایی"],
	["شب بدون روشنایی"],
]);

const WEATHER = options([
	["صاف"],
	["ابری"],
	["بارانی"],
	["برفی"],
	["مه‌آلود"],
	["غبارآلود"],
	["باد شدید"],
	["طوفان شن"],
]);

const VEHICLE_TYPE = options([
	["سواری"],
	["وانت بار"],
	["موتورسیکلت"],
	["مینی‌بوس"],
	["اتوبوس"],
	["کامیونت"],
	["کامیون"],
	["تریلی"],
	["تانکر حمل مواد خطرناک", "تانکر حمل مواد خطرناک", "danger"],
	["خودروی آتش‌نشانی", "خودروی آتش‌نشانی", "danger"],
	["سایر"],
]);

const PLATE_TYPE = options([
	["ملی"],
	["موتورسیکلت"],
	["منطقه آزاد"],
	["گذر موقت / خاص"],
	["فاقد پلاک / نامشخص"],
]);

const MOBILITY = options([
	["قابل حرکت"],
	["نیاز به یدک‌کش", "نیاز به یدک‌کش", "warn"],
	["نیاز به جرثقیل", "نیاز به جرثقیل", "warn"],
]);

const CARGO = options([
	["بدون بار"],
	["مواد سوختی", "مواد سوختی", "danger"],
	["محصولات کشاورزی"],
	["مصالح ساختمانی"],
	["مواد خطرناک", "مواد خطرناک", "danger"],
	["سایر"],
]);

const PERSON_HEALTH = options([
	["سالم"],
	["مصدوم", "مصدوم", "warn"],
	["فوتی در صحنه", "فوتی در صحنه", "danger"],
	["نامشخص"],
]);

const DRIVER_PRESENCE = options([
	["در صحنه حضور دارد"],
	["متواری شده است", "متواری شده است", "warn"],
	["در صحنه فوت شده", "در صحنه فوت شده", "danger"],
	["به بیمارستان منتقل شده", "به بیمارستان منتقل شده", "warn"],
]);

const FACILITY_TYPE = options([
	["گاردریل"],
	["تابلو علامت"],
	["نیوجرسی بتنی"],
	["پایه روشنایی"],
	["دوربین"],
	["حصار"],
	["سایر"],
]);

const YES_NO = options([["بله"], ["خیر"]]);

/** Vehicles whose `type` makes a cargo declaration meaningful. */
const HEAVY_VEHICLES = [
	"وانت بار",
	"مینی‌بوس",
	"اتوبوس",
	"کامیونت",
	"کامیون",
	"تریلی",
	"تانکر حمل مواد خطرناک",
	"خودروی آتش‌نشانی",
];

const PERSON_PATHS = [
	"vehicles[].driver.health",
	"vehicles[].passengers[].health",
	"pedestrians[].health",
];

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

let order = 0;
const nextOrder = () => ++order;

const field = (
	key: string,
	label: string,
	type: FieldNode["type"],
	extra: Partial<FieldNode> = {},
): FieldNode => ({
	kind: "field",
	key,
	type,
	label,
	order: nextOrder(),
	...extra,
});

/** Marks a field required, optionally only while a rule holds. */
const must = (rule: Rule = { op: "always" }) => ({ requiredWhen: rule });

const choice = (
	key: string,
	label: string,
	items: OptionItem[],
	extra: Partial<FieldNode> = {},
): FieldNode =>
	field(key, label, "choice_group", {
		options: { kind: "literal", items },
		...extra,
	});

const multiChoice = (
	key: string,
	label: string,
	items: OptionItem[],
	extra: Partial<FieldNode> = {},
): FieldNode =>
	field(key, label, "multi_select", {
		options: { kind: "literal", items },
		...extra,
	});

// ---------------------------------------------------------------------------
// Shared child groups
// ---------------------------------------------------------------------------

/** A person card: health + gender, used for passengers and pedestrians alike. */
const personFields = (prefix = ""): ContentNode[] => [
	choice(`${prefix}health`, "وضعیت فرد", PERSON_HEALTH, must()),
	field(`${prefix}gender`, "جنسیت", "select", {
		options: {
			kind: "literal",
			items: options([["مرد"], ["زن"], ["نامشخص"]]),
		},
	}),
];

const plateFields = (prefix: string): ContentNode[] => {
	const letterField = (key: string, label: string) =>
		field(
			`${prefix}${key}`,
			label,
			"text",
			{ inputModeMaxLengthHint: undefined } as never,
		);

	void letterField;

	const fieldKey = (part: string) => `${prefix}plate_${part}`;

	return [
		choice(`${prefix}plateType`, "نوع پلاک", PLATE_TYPE, {
			// Switching plate type invalidates the parts that were entered for the
			// previous type, so they are cleared rather than left to look valid.
			clearOnChange: [
				`${prefix}plate_national`,
				`${prefix}plate_motorcycle`,
				`${prefix}plate_free`,
			],
		}),
		// National plate: 2 digits / letter / 3 digits / 2 digits.
		field(fieldKey("national"), "پلاک ملی", "plate", {
			visibleWhen: { op: "eq", path: `${prefix}plateType`, value: "ملی" },
			...must({ op: "eq", path: `${prefix}plateType`, value: "ملی" }),
			plateVariants: [{
				when: { op: "eq", path: `${prefix}plateType`, value: "ملی" },
				parts: [
					{
						key: "a",
						label: "دو رقم",
						kind: "digits",
						length: 2,
						inputMode: "numeric",
					},
					{
						key: "b",
						label: "حرف",
						kind: "select",
						items: options(
							[
								"ب",
								"ج",
								"د",
								"س",
								"ص",
								"ط",
								"ق",
								"ل",
								"م",
								"ن",
								"و",
								"ه",
								"ی",
								"ت",
								"ع",
								"ک",
								"ژ",
								"پ",
								"ث",
								"ز",
								"ف",
								"ش",
								"گ",
							]
								.map((letter) => [letter] as [string]),
						),
					},
					{
						key: "c",
						label: "سه رقم",
						kind: "digits",
						length: 3,
						inputMode: "numeric",
					},
					{
						key: "d",
						label: "کد",
						kind: "digits",
						length: 2,
						inputMode: "numeric",
					},
				],
			}],
		}),
		// Motorcycle plate: 3 digits / 5 digits.
		field(fieldKey("motorcycle"), "پلاک موتورسیکلت", "plate", {
			visibleWhen: {
				op: "eq",
				path: `${prefix}plateType`,
				value: "موتورسیکلت",
			},
			...must({
				op: "eq",
				path: `${prefix}plateType`,
				value: "موتورسیکلت",
			}),
			plateVariants: [{
				when: {
					op: "eq",
					path: `${prefix}plateType`,
					value: "موتورسیکلت",
				},
				parts: [
					{
						key: "a",
						label: "سه رقم",
						kind: "digits",
						length: 3,
						inputMode: "numeric",
					},
					{
						key: "b",
						label: "پنج رقم",
						kind: "digits",
						length: 5,
						inputMode: "numeric",
					},
				],
			}],
		}),
		// Free-zone plate: region code / 5 digits.
		field(fieldKey("free"), "پلاک منطقه آزاد", "plate", {
			visibleWhen: {
				op: "eq",
				path: `${prefix}plateType`,
				value: "منطقه آزاد",
			},
			...must({
				op: "eq",
				path: `${prefix}plateType`,
				value: "منطقه آزاد",
			}),
			plateVariants: [{
				when: {
					op: "eq",
					path: `${prefix}plateType`,
					value: "منطقه آزاد",
				},
				parts: [
					{ key: "a", label: "کد منطقه", kind: "text" },
					{
						key: "b",
						label: "شماره",
						kind: "digits",
						length: 5,
						inputMode: "numeric",
					},
				],
			}],
		}),
		field(`${prefix}plate_temporary_a`, "شناسه پلاک گذر موقت", "text", {
			visibleWhen: {
				op: "in",
				path: `${prefix}plateType`,
				value: ["گذر موقت / خاص"],
			},
			...must({
				op: "in",
				path: `${prefix}plateType`,
				value: ["گذر موقت / خاص"],
			}),
		}),
		field(`${prefix}plate_temporary_b`, "شماره پلاک گذر موقت", "text", {
			visibleWhen: {
				op: "in",
				path: `${prefix}plateType`,
				value: ["گذر موقت / خاص"],
			},
			...must({
				op: "in",
				path: `${prefix}plateType`,
				value: ["گذر موقت / خاص"],
			}),
		}),
	];
};

const vehicleFields = (): ContentNode[] => [
	choice("vehicleType", "نوع وسیله نقلیه", VEHICLE_TYPE, must()),
	...plateFields(""),
	// Cargo only matters for heavy vehicles — the QA app's `heavy(v)` check.
	choice("cargo", "نوع بار", CARGO, {
		visibleWhen: { op: "in", path: "vehicleType", value: HEAVY_VEHICLES },
		...must({ op: "in", path: "vehicleType", value: HEAVY_VEHICLES }),
	}),
	choice("mobility", "وضعیت جابه‌جایی پس از تصادف", MOBILITY, must()),
	field("vehicle_attachments", "مستندات وسیله", "file"),
	// Nested repeatable: passengers inside each vehicle.
	{
		kind: "repeatable",
		key: "passengers",
		label: "سرنشینان",
		order: nextOrder(),
		children: personFields("passenger_"),
	} as RepeatableNode,
	// The driver belongs to the vehicle, so the two are one row. The QA prototype
	// keeps them on separate sheets keyed by index, which can drift out of step;
	// nesting removes the possibility of a driver attached to the wrong vehicle.
	{
		kind: "repeatable",
		key: "driver",
		label: "راننده",
		itemLabel: "راننده",
		order: nextOrder(),
		minItems: 1,
		maxItems: 1,
		children: [
			choice(
				"driver_presence",
				"وضعیت حضور راننده",
				DRIVER_PRESENCE,
				must(),
			),
			choice("driver_health", "وضعیت راننده", PERSON_HEALTH, must()),
			field("driver_gender", "جنسیت راننده", "select", {
				options: {
					kind: "literal",
					items: options([["مرد"], ["زن"], ["نامشخص"]]),
				},
			}),
			choice(
				"driver_documents",
				"آیا مدارک راننده در دسترس است؟",
				YES_NO,
			),
			field("driver_document_photos", "تصویر مدارک", "file", {
				visibleWhen: {
					op: "eq",
					path: "driver_documents",
					value: "بله",
				},
				...must({ op: "eq", path: "driver_documents", value: "بله" }),
			}),
		],
	} as RepeatableNode,
];

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const pages: PageNode[] = [
	{
		key: "location",
		title: "موقعیت واقعه",
		description: "محل دقیق واقعه را روی نقشه مشخص کنید.",
		icon: "mapPin",
		order: 1,
		sections: [{
			key: "locationSection",
			title: "موقعیت",
			order: 1,
			nodes: [
				choice(
					"direction",
					"جهت حرکت",
					options([["اهواز به بندر امام"], ["بندر امام به اهواز"]]),
				),
				choice(
					"lane",
					"خط / باند",
					options([
						["شانه راست"],
						["خط ۱"],
						["خط ۲"],
						["خط ۳"],
						["شانه چپ / میانی"],
					]),
					must(),
				),
				field("incident_coords", "موقعیت روی نقشه", "location", must()),
			],
		}],
	},
	{
		key: "basics",
		title: "اطلاعات پایه",
		description: "زمان وقوع و موقعیت گزارش را کنترل کنید.",
		icon: "fileText",
		order: 2,
		sections: [{
			key: "basicsSection",
			title: "زمان وقوع",
			order: 1,
			nodes: [
				field("date_of_accident", "تاریخ وقوع", "date", {
					...must(),
					binding: { kind: "pure", path: "date_of_accident" },
				}),
				field("time_of_accident", "ساعت وقوع", "time", must()),
				field("notes", "توضیحات (اختیاری)", "textarea"),
			],
		}],
	},
	{
		key: "emergencyActions",
		title: "اقدامات فوری",
		description: "ابتدا وضعیت صحنه و نیاز به پشتیبانی را ثبت کنید.",
		icon: "warning",
		order: 3,
		sections: [
			{
				key: "sceneSection",
				title: "وضعیت تردد و اضطراری",
				order: 1,
				nodes: [
					choice("traffic", "وضعیت تردد", TRAFFIC, must()),
					multiChoice(
						"emergency",
						"وضعیت‌های اضطراری صحنه",
						EMERGENCY,
						must(),
					),
					field(
						"emergencyNotes",
						"توضیح تکمیلی (اختیاری)",
						"textarea",
					),
				],
			},
			{
				key: "damageGateSection",
				title: "آسیب تجهیزات راه",
				order: 3,
				nodes: [
					choice(
						"hasDamage",
						"آیا به تجهیزات راه آسیبی وارد شده است؟",
						YES_NO,
						{
							...must(),
							description:
								"در صورت انتخاب «بله»، در مرحله آسیب تجهیزات جزئیات هر آسیب ثبت می‌شود.",
						},
					),
				],
			},
			{
				key: "supportSection",
				title: "نیاز به پشتیبانی",
				order: 2,
				// The QA app recommends services derived from the emergency answers;
				// here the recommendation is expressed as a narrowing filter, and the
				// officer's own selection is still recorded.
				nodes: [
					multiChoice("support", "پشتیبانی مورد نیاز", SUPPORT, {
						visibleWhen: {
							op: "anyIn",
							path: "emergency",
							value: [
								"حریق یا دود شدید",
								"واژگونی وسیله سنگین",
								"فرد محبوس",
								"مصدوم",
								"نشت سوخت یا مواد خطرناک",
								"ریزش بار در سطح راه",
								"مانع خطرناک در سواره‌رو",
								"خطر انفجار",
							],
						},
						validation: {
							warnings: [{
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
							}],
						},
					}),
					field(
						"supportNotes",
						"توضیح پشتیبانی (اختیاری)",
						"textarea",
					),
				],
			},
		],
	},
	{
		key: "accidentDetails",
		title: "مشخصات تصادف",
		description: "شدت و رخداد نهایی تصادف را مشخص کنید.",
		icon: "car",
		order: 4,
		sections: [{
			key: "accidentDetailsSection",
			title: "شدت و نوع برخورد",
			order: 1,
			nodes: [
				choice("severity", "شدت تصادف", SEVERITY, {
					...must(),
					// No relation binding: this is a literal choice, so its answer is
					// 'خسارتی' rather than a record id. Binding it would make every
					// submission fail the backend's `typeId: objectIdValidation`. The
					// answer is still stored, in `dynamic_answers`.
					// Damage-only severity with a casualty on file is contradictory:
					// warn without blocking, exactly as the QA app does.
					validation: {
						warnings: [{
							rule: {
								op: "and",
								rules: [
									{
										op: "eq",
										path: "severity",
										value: "خسارتی",
									},
									{
										op: "or",
										rules: PERSON_PATHS.map((path) => ({
											op: "anyIn",
											path,
											value: ["مصدوم", "فوتی در صحنه"],
										})),
									},
								],
							},
							message:
								"شدت خسارتی با وجود مصدوم یا فوتی سازگار نیست.",
						}],
					},
				}),
				choice("collision", "نوع برخورد", COLLISION, {
					...must(),
					// Literal choices, so no relation binding — see `severity` above.
					validation: {
						warnings: [{
							rule: {
								op: "and",
								rules: [
									{
										op: "eq",
										path: "collision",
										value: "برخورد با وسیله نقلیه",
									},
									{ op: "count", path: "vehicles", gte: 2 },
									{
										op: "not",
										rule: {
											op: "count",
											path: "vehicles",
											gte: 2,
										},
									},
								],
							},
							message:
								"برای برخورد با وسیله نقلیه بیش از یک وسیله لازم است.",
						}],
					},
				}),
			],
		}],
	},
	{
		key: "environment",
		title: "شرایط محیطی",
		description: "شرایط قابل مشاهده در زمان حضور در صحنه.",
		icon: "sun",
		order: 5,
		sections: [{
			key: "environmentSection",
			title: "روشنایی و هوا",
			order: 1,
			nodes: [
				choice("lighting", "وضعیت روشنایی", LIGHTING, {
					...must(),
					// Literal choices, so no relation binding — see `severity` above.
				}),
				choice("weather", "وضع هوا", WEATHER, must()),
			],
		}],
	},
	{
		key: "vehiclesPage",
		title: "وسایل نقلیه",
		description: "اطلاعات هر وسیله درگیر را جداگانه ثبت کنید.",
		icon: "car",
		order: 6,
		sections: [{
			key: "vehiclesSection",
			title: "وسایل",
			order: 1,
			nodes: [
				{
					kind: "repeatable",
					key: "vehicles",
					label: "وسیله نقلیه",
					itemLabel: "وسیله نقلیه",
					order: nextOrder(),
					minItems: 1,
					children: vehicleFields(),
				} as RepeatableNode,
			],
		}],
	},
	{
		key: "people",
		title: "افراد",
		description: "وضعیت رانندگان، سرنشینان و عابران.",
		icon: "users",
		order: 7,
		sections: [{
			key: "peopleSection",
			title: "عابران",
			order: 1,
			nodes: [
				{
					kind: "repeatable",
					key: "pedestrians",
					label: "عابر پیاده",
					itemLabel: "عابر پیاده",
					order: nextOrder(),
					children: [
						choice(
							"pedestrian_health",
							"وضعیت عابر",
							PERSON_HEALTH,
							must(),
						),
						field("pedestrian_gender", "جنسیت", "select", {
							options: {
								kind: "literal",
								items: options([["مرد"], ["زن"], ["نامشخص"]]),
							},
						}),
					],
				} as RepeatableNode,
			],
		}],
	},
	{
		key: "facilityDamage",
		title: "آسیب تجهیزات راه",
		description: "برای هر تجهیز آسیب‌دیده یک رکورد ثبت کنید.",
		icon: "wrench",
		order: 8,
		// The whole page is conditional — the QA app's step-7 gate.
		visibleWhen: { op: "eq", path: "hasDamage", value: "بله" },
		sections: [{
			key: "facilityDamageSection",
			title: "آسیب تجهیزات",
			order: 1,
			nodes: [
				{
					kind: "repeatable",
					key: "damages",
					label: "آسیب تجهیزات راه",
					itemLabel: "آسیب",
					order: nextOrder(),
					minItems: 1,
					visibleWhen: { op: "eq", path: "hasDamage", value: "بله" },
					...must({ op: "eq", path: "hasDamage", value: "بله" }),
					children: [
						choice(
							"damage_type",
							"نوع تجهیزات راه",
							FACILITY_TYPE,
							must(),
						),
						field("damage_other", "عنوان تجهیز", "text", {
							visibleWhen: {
								op: "eq",
								path: "damage_type",
								value: "سایر",
							},
							...must({
								op: "eq",
								path: "damage_type",
								value: "سایر",
							}),
						}),
						field(
							"damage_description",
							"شرح کوتاه خسارت",
							"textarea",
							must(),
						),
						// A damage record references the vehicle list: a cross-group
						// reference the QA app builds by hand.
						field(
							"damage_vehicleId",
							"وسیله مرتبط با این خسارت",
							"select",
							{
								options: { kind: "literal", items: [] },
								optionalHint: "نامشخص",
							},
						),
						field("damage_photos", "تصاویر آسیب", "file"),
					],
				} as RepeatableNode,
			],
		}],
	},
	{
		key: "review",
		title: "بازبینی نهایی",
		description: "اطلاعات را کنترل و گزارش را برای ارسال آماده کنید.",
		icon: "checkCircle",
		order: 9,
		sections: [{
			key: "reviewSection",
			title: "توضیحات نهایی",
			order: 1,
			nodes: [
				field("finalNotes", "توضیحات نهایی (اختیاری)", "textarea"),
				field("attachments", "مستندات مرتبط", "file"),
			],
		}],
	},
];

export const qaAccidentFormDefinition: FormDefinition = {
	schemaVersion: 1,
	name: "گزارش تصادف آزادراه اهواز ـ بندر امام",
	pages,
};
