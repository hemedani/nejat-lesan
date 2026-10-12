/**
 * The accident report form, expressed as a form definition.
 *
 * Moved here from `mobile/src/domain/qa-accident-form.ts`, which is now a
 * re-export shim. It lives in the engine so the backend can activate this exact
 * definition as an organization's accident form — one artifact, imported by both
 * `mobile/src/domain/default-accident-form.ts` and the backend's seed.
 *
 * It began as a faithful encoding of `qa_docs/QA_AR/Accident_Report_App.html`
 * (739 lines of hand-written JavaScript) with **no application code at all**:
 * every behaviour the QA team's prototype achieved with code is expressed
 * declaratively here. It is still the engine's acceptance test, and the mapping
 * still holds for everything it covers:
 *
 * | QA prototype                    | Definition mechanism                     |
 * | ------------------------------- | --------------------------------------- |
 * | multi-step wizard with a rail   | `pages[]`                                |
 * | `hasDamage === 'بله'` gate      | `visibleWhen` on a group                 |
 * | `plateType` → 4 different parts | `plateVariants` selected by a rule        |
 * | heavy vehicle → cargo select    | `visibleWhen` on a field                  |
 * | nested `vehicles[].passengers[]`| nested `repeatable`                       |
 * | `errors()` blocks, `warnings()` | `requiredWhen` vs `validation.warnings`   |
 * | plate type clears plate parts   | `clearOnChange`                           |
 * | min one vehicle                 | `minItems: 1`                             |
 * | tone-coded danger choices       | `OptionItem.tone`                         |
 * | vehicle collision, one vehicle  | `count` under `not`                       |
 *
 * The prototype's `reference` option lists are not mapped: every list here is
 * literal, so the form renders with no network at all — which a definition the
 * app ships as its offline fallback has to be able to do.
 *
 * ## Where it deliberately differs from the prototype
 *
 * The client's arrangement has moved the form on from the prototype, so this is
 * no longer a verbatim copy. Every difference below is a product decision rather
 * than an engine gap — none of them needed code to express, which is the whole
 * reason this file is still the acceptance test:
 *
 * - **The traffic/emergency page is gone.** It existed to feed a control centre
 *   that is not operational yet. Until it is, road-equipment damage is reported
 *   by the officer on its own page and nothing waits on a dispatch decision.
 *   That removed `traffic`, `emergency`, `emergencyNotes`, `support` and
 *   `supportNotes`, and with them the prototype's `emergency → support`
 *   suggestion and its crane advisory.
 * - **Road-equipment damage is unconditional.** `hasDamage` used to gate a whole
 *   page, which left the page unreachable until it had been answered. It now
 *   gates only the damage list, so the page is always reachable and «بله»
 *   enables «افزودن آسیب» on the spot.
 * - **The lane list has two carriageways.** آزادراه خلیج فارس — the demo road —
 *   carries one lane each way, so «خط ۳» does not exist.
 * - **Pedestrians and cyclists are not collision partners.** Neither belongs on
 *   a limited-access freeway, so «برخورد با عابر» and «برخورد با دوچرخه» are
 *   not offered.
 * - **The driver has no health field.** «وضعیت راننده» restated what
 *   `driver_presence` already records («در صحنه فوت شده», «به بیمارستان منتقل
 *   شده») and the two could disagree. The severity advisory reads
 *   `driver_presence` instead.
 * - **The accident date and time start at now.** A patrol officer at the
 *   roadside is describing something that has just happened, so both fields
 *   declare `defaultSource: "now"`.
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
	["برخورد با موتورسیکلت"],
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

/**
 * Paths that record a person's condition, for the severity advisory.
 *
 * The driver is deliberately absent: the form no longer asks for a driver's
 * health, because `driver_presence` already says whether they were killed or
 * taken to hospital. That answer is read separately below, so a driver casualty
 * is still seen by the check.
 */
const PERSON_PATHS = [
	"vehicles[].passengers[].health",
	"pedestrians[].health",
];

/** `driver_presence` answers that mean the driver was hurt, not merely present. */
const DRIVER_CASUALTY = ["در صحنه فوت شده", "به بیمارستان منتقل شده"];

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
	// The driver belongs to the vehicle, so the two are one row. The QA prototype
	// keeps them on separate sheets keyed by index, which can drift out of step;
	// nesting removes the possibility of a driver attached to the wrong vehicle.
	//
	// Declared before `passengers` because the officer identifies who was driving
	// before counting who was riding: the driver's row is the one that carries the
	// documents question, and answering it first is what the client asked for.
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
	// Nested repeatable: passengers inside each vehicle.
	{
		kind: "repeatable",
		key: "passengers",
		label: "سرنشینان",
		order: nextOrder(),
		children: personFields("passenger_"),
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
					// Two carriageways, not three: آزادراه خلیج فارس — the road this
					// form's demo organization patrols — carries one lane each way, so
					// «خط ۳» would offer a lane the officer cannot be standing in.
					options([
						["شانه راست"],
						["خط ۱"],
						["خط ۲"],
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
				// Both start at now: an officer at the roadside is describing an
				// incident that has just happened, and the common case should not
				// need a picker opened at all. It is a default, not a fact — the
				// officer can change either answer, and a value restored from a
				// saved draft always wins over it (`seedDefaultAnswers`).
				field("date_of_accident", "تاریخ وقوع", "date", {
					...must(),
					binding: { kind: "pure", path: "date_of_accident" },
					defaultSource: "now",
				}),
				field("time_of_accident", "ساعت وقوع", "time", {
					...must(),
					defaultSource: "now",
				}),
				field("notes", "توضیحات (اختیاری)", "textarea"),
			],
		}],
	},
	{
		key: "accidentDetails",
		title: "مشخصات تصادف",
		description: "شدت و رخداد نهایی تصادف را مشخص کنید.",
		icon: "car",
		order: 3,
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
										rules: [
											// `: Rule` is not decoration: spreading a mapped array
											// into a larger literal drops the contextual type,
											// and `op` would widen to `string`.
											...PERSON_PATHS.map((
												path,
											): Rule => ({
												op: "anyIn",
												path,
												value: [
													"مصدوم",
													"فوتی در صحنه",
												],
											})),
											// The driver's own condition, now that the form
											// asks for no driver health. Without this the
											// check would stop seeing a driver casualty at
											// all — the one person every vehicle has.
											{
												op: "anyIn",
												path:
													"vehicles[].driver.presence",
												value: DRIVER_CASUALTY,
											},
										],
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
									// «Fewer than two vehicles on file», written as the
									// negation of `gte: 2` because `count` has no `lt`.
									// The rule used to carry `count >= 2` *and*
									// `not (count >= 2)` — a contradiction, false for
									// every possible answer, so this warning could never
									// fire however the report was filled in.
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
		order: 4,
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
		order: 5,
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
		order: 6,
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
		description:
			"اگر به تجهیزات راه آسیبی وارد شده، جزئیات آن را ثبت کنید.",
		icon: "wrench",
		order: 7,
		// Always reachable. This page used to be conditional on `hasDamage`, which
		// made the question that gates it unanswerable — the QA prototype's own
		// circular gate. It is also the only place road-equipment damage is
		// reported now that the control centre is not yet operational, so it must
		// not be skipped. The answer gates the *list* instead: «بله» reveals
		// «افزودن آسیب» on the spot, «خیر» files the page with nothing on it.
		sections: [{
			key: "facilityDamageSection",
			title: "آسیب تجهیزات",
			order: 1,
			nodes: [
				choice(
					"hasDamage",
					"آیا به تجهیزات راه آسیبی وارد شده است؟",
					YES_NO,
					{
						...must(),
						description:
							"در صورت انتخاب «بله»، فهرست آسیب‌ها برای ثبت جزئیات فعال می‌شود.",
					},
				),
				{
					kind: "repeatable",
					key: "damages",
					label: "آسیب تجهیزات راه",
					itemLabel: "آسیب",
					order: nextOrder(),
					minItems: 1,
					// No `requiredWhen`: an invisible node is never required
					// (`isNodeRequired` says so), and the validator skips it outright,
					// so a rule here would read like a second gate without being one.
					// `minItems` is what makes «بله» mean "record at least one".
					visibleWhen: { op: "eq", path: "hasDamage", value: "بله" },
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
		order: 8,
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
