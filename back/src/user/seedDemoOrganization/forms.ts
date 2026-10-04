import { type FormDefinition, qaAccidentFormDefinition } from "@forms";
import { type ObjectId } from "@deps";
import { FORM_SCHEMA_VERSION } from "@model";
import { form_definition, getAtcsWithServices } from "../../../mod.ts";
import { getEffectiveKeysForOrg } from "../../app_modules/moduleConfig.ts";
import { collectReferenceModels } from "../../form_definition/helpers.ts";
import { fail } from "./org.ts";

/**
 * فرم‌های دموی سازمان آزادراه اهواز – بندر امام.
 *
 * این فایل **فقط تعریف فرم‌ها** است: هیچ کد پایگاه‌داده یا فعال‌سازی‌ای اینجا
 * نیست. فعال‌سازی در `seedDemoOrganization.fn.ts` و از راه خودِ اکشن
 * واقعی `form_definition.activate` انجام می‌شود — چون `activate` تنها جایی است
 * که معنای یک تعریف بررسی می‌شود، و فرمی که از فعال‌سازی واقعی جان سالم به در
 * برده، فرمی است که واقعاً می‌تواند ثبت شود.
 */

/** مشخصات هر فرم: چیزی که روی خود سند `form_definition` می‌نشیند. */
export type SeedForm = {
	name: string;
	description: string;
	icon: string;
	form_kind: "accident" | "incident_report";
	definition: FormDefinition;
};

/** هر سه فرم گزارش رخداد با این نسخهٔ اسکیما ساخته می‌شوند. */
const schemaVersion = FORM_SCHEMA_VERSION;

// ---------------------------------------------------------------------------
// ۱) فرم تصادف — عیناً همان تعریف تیم QA
// ---------------------------------------------------------------------------

/**
 * فرم تصادف دمو = همان فرم تیم QA، بدون یک کپی دوم.
 *
 * `qaAccidentFormDefinition` یک کپی دستی از
 * `qa_docs/QA_AR/Accident_Report_App.html` است و آزمون پذیرش موتور فرم است؛
 * رونویسی دوباره‌اش یعنی یک نسخهٔ دوم که از همان artefact تحت آزمون جدا
 * می‌افتد. پس تعریف عیناً همان‌طور که هست برگردانده می‌شود.
 */
export const qaAccidentSeedForm = (): SeedForm => ({
	name: qaAccidentFormDefinition.name,
	description:
		"فرم کامل ثبت تصادف آزادراه، عیناً همان فرمی که تیم QA تعریف کرده است.",
	icon: "car",
	form_kind: "accident",
	definition: qaAccidentFormDefinition,
});

// ---------------------------------------------------------------------------
// ۲) خرابی سطح راه
// ---------------------------------------------------------------------------

/**
 * خرابی سطح راه.
 *
 * مکانیزم‌هایی که فرم QA ندارد: گزینهٔ `reference` (فرم QA صفر گزینهٔ
 * مرجع دارد)، اتصال **چندتایی** به `incident_report.road_defects`، و اتصال
 * **تک‌انتخابی** به `incident_report.incident_severity`.
 */
export const roadDamageSeedForm = (): SeedForm => ({
	name: "خرابی سطح راه",
	description:
		"ثبت نقص سطح راه آسفالت، لبه، شانه و روکش، همراه با شدت و اقدام موقت.",
	icon: "roadHorizon",
	form_kind: "incident_report",
	definition: {
		schemaVersion,
		name: "خرابی سطح راه",
		pages: [
			{
				key: "damage",
				title: "شناسایی آسیب",
				icon: "roadHorizon",
				order: 1,
				sections: [
					{
						key: "defect_kind",
						title: "نوع آسیب",
						order: 1,
						nodes: [
							{
								kind: "field",
								key: "damage_defects",
								type: "multi_select",
								label: "نوع آسیب سطح راه",
								order: 1,
								options: {
									kind: "reference",
									model: "road_defect",
								},
								binding: {
									kind: "relation",
									path: "road_defects",
									multi: true,
								},
							},
							{
								kind: "field",
								key: "severity",
								type: "reference",
								label: "سطح اهمیت آسیب",
								order: 2,
								options: {
									kind: "reference",
									model: "incident_severity",
								},
								binding: {
									kind: "relation",
									path: "incident_severity",
								},
							},
							{
								kind: "field",
								key: "surface_conditions",
								type: "multi_select",
								label: "وضعیت سطح راه در محل آسیب",
								order: 3,
								options: {
									kind: "reference",
									model: "road_surface_condition",
								},
								binding: {
									kind: "relation",
									path: "road_surface_conditions",
									multi: true,
								},
							},
						],
					},
					{
						key: "extent",
						title: "گستره و فوریت",
						order: 2,
						nodes: [
							{
								kind: "field",
								key: "damage_length_m",
								type: "number",
								label: "طول آسیب (متر)",
								order: 1,
								validation: {
									min: 0,
									max: 5000,
									message:
										"طول آسیب باید عددی بین ۰ تا ۵۰۰۰ متر باشد.",
								},
							},
							{
								kind: "field",
								key: "damage_depth_cm",
								type: "number",
								label: "عمق آسیب (سانتی‌متر)",
								order: 2,
								validation: {
									min: 0,
									max: 100,
									message:
										"عمق آسیب باید عددی بین ۰ تا ۱۰۰ سانتی‌متر باشد.",
								},
							},
							{
								kind: "field",
								key: "needs_repair",
								type: "boolean",
								label: "نیاز به تعمیر دارد؟",
								order: 3,
								binding: { kind: "pure", path: "needs_repair" },
							},
						],
					},
				],
			},
			{
				key: "actions",
				title: "اقدام و شرح",
				icon: "hardHat",
				order: 2,
				sections: [
					{
						key: "report",
						title: "شرح وضعیت",
						order: 1,
						nodes: [
							{
								kind: "field",
								key: "damage_description",
								type: "textarea",
								label: "شرح آسیب",
								order: 1,
								binding: { kind: "pure", path: "description" },
							},
							{
								kind: "field",
								key: "temporary_action",
								type: "text",
								label: "اقدام موقت انجام‌شده",
								order: 2,
								optionalHint:
									"اگر موقتاً چیزی انجام نشده، خالی بگذارید.",
								visibleWhen: {
									op: "eq",
									path: "needs_repair",
									value: true,
								},
								binding: {
									kind: "pure",
									path: "temporary_action",
								},
							},
							{
								kind: "field",
								key: "follow_up_required",
								type: "boolean",
								label: "نیاز به پیگیری بعدی دارد؟",
								order: 3,
								binding: {
									kind: "pure",
									path: "follow_up_required",
								},
							},
						],
					},
				],
			},
		],
	},
});

// ---------------------------------------------------------------------------
// ۳) مانع در سطح راه
// ---------------------------------------------------------------------------

/**
 * مانع در سطح راه.
 *
 * مکانیزم‌هایی که فرم QA ندارد: گزینهٔ `reference`، فیلد `computed` با
 * `valueFrom` (فرم QA هیچ فیلد محاسبه‌شده‌ای ندارد)، و اتصال به
 * `incident_report.position`.
 */
export const roadObstructionSeedForm = (): SeedForm => ({
	name: "مانع در سطح راه",
	description:
		"ثبت مانع در سطح راه — خودروی متوقف، بار افتاده، حیوان یا هر مانع دیگر.",
	icon: "barricade",
	form_kind: "incident_report",
	definition: {
		schemaVersion,
		name: "مانع در سطح راه",
		pages: [
			{
				key: "obstruction",
				title: "شناسایی مانع",
				icon: "barricade",
				order: 1,
				sections: [
					{
						key: "where",
						title: "محل و وضعیت مانع",
						order: 1,
						nodes: [
							{
								kind: "field",
								key: "obstruction_position",
								type: "reference",
								label: "محل وقوع",
								order: 1,
								options: {
									kind: "reference",
									model: "position",
								},
								binding: { kind: "relation", path: "position" },
							},
							{
								kind: "field",
								key: "road_kilometer",
								type: "number",
								label: "کیلومتر",
								order: 2,
								binding: { kind: "pure", path: "kilometer" },
							},
							{
								kind: "field",
								key: "road_meter",
								type: "number",
								label: "متر",
								order: 3,
								binding: { kind: "pure", path: "meter" },
							},
							{
								kind: "field",
								key: "obstruction_hours",
								type: "number",
								label: "مدت انسداد (ساعت)",
								order: 4,
								// عملوندِ `hazard_summary` است و رندرکنندهٔ `computed` دوتایی
								// است («بله»/«خیر»)، پس عملوندش نباید اختیاری باشد: در موتور
								// تنها راه اجباری‌بودن همین `requiredWhen` است، و قاعدهٔ
								// `gt 0` روی مقدارِ تعریف‌نشده `false` می‌شود — یعنی مأموری که
								// اصلاً جوابی نداده بود «خیر» می‌دید، و فرم داشتنِ انسداد را
								// نفی می‌کرد. با اجباری‌بودن، «بله»/«خیر» جوابِ همان پرسشی است
								// که مأمور دارد به آن جواب می‌دهد.
								requiredWhen: { op: "always" },
								validation: {
									min: 0,
									max: 72,
									message:
										"مدت انسداد باید عددی بین ۰ تا ۷۲ ساعت باشد.",
								},
							},
						],
					},
					{
						key: "hazard",
						title: "خطر و تجهیزات",
						order: 2,
						nodes: [
							{
								kind: "field",
								key: "is_hazard",
								type: "boolean",
								label: "خطر فوری برای تردد دارد؟",
								order: 1,
								binding: { kind: "pure", path: "is_hazard" },
							},
							{
								kind: "field",
								key: "hazard_summary",
								type: "computed",
								// تنها renderer موتور برای `computed` نتیجهٔ قاعده را
								// «بله»/«خیر» می‌نویسد، پس برچسب باید همان پرسشی باشد
								// که بله/خیر جوابش است. قاعده `gt 0` است، نه «بیش از یک
								// ساعت» — یعنی «آیا انسدادی رخ داده است؟».
								label: "آیا انسداد رخ داده است؟",
								order: 2,
								valueFrom: {
									op: "gt",
									path: "obstruction_hours",
									value: 0,
								},
							},
							{
								kind: "field",
								key: "hazard_note",
								type: "textarea",
								label: "اقدام فوری انجام‌شده",
								order: 3,
								visibleWhen: {
									op: "eq",
									path: "is_hazard",
									value: true,
								},
								requiredWhen: {
									op: "eq",
									path: "is_hazard",
									value: true,
								},
							},
							{
								kind: "field",
								key: "equipment_damages",
								type: "multi_select",
								label: "تجهیزات آسیب‌دیده",
								order: 4,
								options: {
									kind: "reference",
									model: "equipment_damage",
								},
								binding: {
									kind: "relation",
									path: "equipment_damages",
									multi: true,
								},
							},
						],
					},
				],
			},
			{
				key: "handling",
				title: "اقدام انجام‌شده",
				icon: "signpost",
				order: 2,
				sections: [
					{
						key: "action",
						title: "اقدام",
						order: 1,
						nodes: [
							{
								kind: "field",
								key: "handling_action",
								type: "textarea",
								label: "شرح اقدام تا رفع مانع",
								order: 1,
								binding: {
									kind: "pure",
									path: "temporary_action",
								},
							},
							{
								kind: "field",
								key: "resolved",
								type: "boolean",
								label: "مانع در همان شیفت رفع شد؟",
								order: 2,
							},
							{
								kind: "field",
								key: "resolved_at",
								type: "datetime",
								label: "زمان رفع مانع",
								order: 3,
								visibleWhen: {
									op: "eq",
									path: "resolved",
									value: true,
								},
								requiredWhen: {
									op: "eq",
									path: "resolved",
									value: true,
								},
							},
						],
					},
				],
			},
		],
	},
});

// ---------------------------------------------------------------------------
// ۴) خرابی روشنایی
// ---------------------------------------------------------------------------

/**
 * خرابی روشنایی.
 *
 * مکانیزم‌هایی که فرم QA ندارد: گزینهٔ `reference` و اتصال تک‌انتخابی به
 * `incident_report.light_status` و `incident_report.road_situation`.
 */
export const lightingFailureSeedForm = (): SeedForm => ({
	name: "خرابی روشنایی",
	description: "ثبت خرابی چراغ‌های روشنایی آزادراه همراه با وضعیت دید.",
	icon: "lightbulb",
	form_kind: "incident_report",
	definition: {
		schemaVersion,
		name: "خرابی روشنایی",
		pages: [
			{
				key: "lighting",
				title: "روشنایی و شرایط محیطی",
				icon: "lightbulb",
				order: 1,
				sections: [
					{
						key: "status",
						title: "وضعیت روشنایی",
						order: 1,
						nodes: [
							{
								kind: "field",
								key: "light_status",
								type: "reference",
								label: "وضعیت روشنایی در محل",
								order: 1,
								options: {
									kind: "reference",
									model: "light_status",
								},
								binding: {
									kind: "relation",
									path: "light_status",
								},
							},
							{
								kind: "field",
								key: "road_situation",
								type: "reference",
								label: "وضعیت جاده",
								order: 2,
								options: {
									kind: "reference",
									model: "road_situation",
								},
								binding: {
									kind: "relation",
									path: "road_situation",
								},
							},
						],
					},
					{
						key: "lamps",
						title: "چراغ‌های خراب",
						order: 2,
						nodes: [
							{
								kind: "field",
								key: "lamp_count",
								type: "number",
								label: "تعداد چراغ‌های خراب",
								order: 1,
								validation: {
									min: 0,
									max: 200,
									message:
										"تعداد چراغ باید عددی بین ۰ تا ۲۰۰ باشد.",
								},
							},
							{
								kind: "field",
								key: "pole_id",
								type: "text",
								label: "شماره پایه چراغ",
								order: 2,
								optionalHint: "اگر چراغ روی پایه شماره‌دار است.",
							},
							{
								kind: "field",
								key: "repair_crew_needed",
								type: "boolean",
								label: "نیاز به اعزام اکیپ روشنایی هست؟",
								order: 3,
								requiredWhen: {
									op: "gt",
									path: "lamp_count",
									value: 0,
								},
							},
							{
								kind: "field",
								key: "crew_note",
								type: "text",
								label: "توضیح اعزام اکیپ",
								order: 4,
								visibleWhen: {
									op: "eq",
									path: "repair_crew_needed",
									value: true,
								},
							},
						],
					},
				],
			},
		],
	},
});

// ---------------------------------------------------------------------------
// مجموعه
// ---------------------------------------------------------------------------

/**
 * هر چهار فرم، **به این ترتیب**.
 *
 * فرم تصادف اول است چون تنها فرم فعال تصادفِ سازمان است: هم `activate` فرم‌های
 * فعال تصادف دیگر همان سازمان را بایگانی می‌کند، هم یک ایندکس یکتای جزئی روی
 * `{organization._id}` با شرط `{status:"active", form_kind:"accident"}` این را در
 * سطح پایگاه‌داده تضمین می‌کند. فعال‌کردن آن اول یعنی چیز مهمی غافلگیرانه
 * بایگانی نمی‌شود.
 *
 * سه فرم گزارش رخداد محدودیت یکتایی ندارند، ولی همین ترتیب خوانده‌شدنی‌تر است.
 */
export const demoSeedForms = (): SeedForm[] => [
	qaAccidentSeedForm(),
	roadDamageSeedForm(),
	roadObstructionSeedForm(),
	lightingFailureSeedForm(),
];

// ---------------------------------------------------------------------------
// فعال‌سازی
// ---------------------------------------------------------------------------

/**
 * مدل‌های مرجعی که فرم‌های دمو نام می‌برند — **مشتق‌شده، نه فهرست دستی**.
 *
 * `activate` پیش از هر چیز `checkReferenceModels` را صدا می‌زند و اگر مدلی
 * **هیچ رکوردی** نداشته باشد، فعال‌سازی را رد می‌کند
 * («مدل «…» هیچ رکوردی ندارد؛ گزینه‌ای برای نمایش وجود ندارد.»). پس باید پیش از
 * ساختن حتی یک draft بدانیم کدام مدل‌ها باید پر شده باشند.
 *
 * این فهرست عمداً از `collectReferenceModels` — همان تابعی که خودِ
 * `checkReferenceModels` استفاده می‌کند — مشتق می‌شود، نه اینکه دستی نوشته شود.
 * یک فهرست دستی با افزودن یک مدل مرجعِ پنجم به یکی از فرم‌ها، بی‌صدا از پوشش
 * خارج می‌شد و دقیقاً همان نیمه‌کاره‌شدنی را برمی‌گرداند که این بررسی برای
 * جلوگیری از آن است. یک منبع یعنی این دو نمی‌توانند اختلاف پیدا کنند.
 *
 * تنها `user.seedShared` این مدل‌ها را پر می‌کند و آن هم فقط با سطح
 * Manager/Ghost — پس ترتیب `seedShared` **قبل از** این اکشن اجباری است.
 *
 * توجه: فرم تصادف QA صفر گزینهٔ مرجع دارد، پس عملاً این فهرست فقط برای سه فرم
 * گزارش رخداد معنا دارد — و دقیقاً همان‌هایی است که `seedShared` پر می‌کند.
 */
export const demoReferenceModels = (): string[] =>
	[
		...new Set(
			demoSeedForms().flatMap((form) =>
				collectReferenceModels(form.definition)
			),
		),
	].sort();

/**
 * همان گاردی که `helpers.ts` روی یک «مدل» می‌گذارد، تا یک اکسپورت غیرمدل به
 * جای `TypeError` همان پیام فارسی را بگیرد. (`isModelLike` آنجا private است؛
 * اینجا عمداً کپیِ کوچک و همتاست تا آن فایل دست‌نخورده بماند.)
 */
const isModelLike = (candidate: unknown): candidate is {
	countDocument: (q: unknown) => Promise<number>;
} => typeof candidate === "object" && candidate !== null &&
	typeof (candidate as { countDocument?: unknown }).countDocument ===
		"function" &&
	typeof (candidate as { find?: unknown }).find === "function";

/**
 * همهٔ مدل‌های مرجعِ لازم باید رکورد داشته باشند، وگرنه `activate` رد می‌کند.
 */
export const assertDemoReferenceModelsSeeded = async (
	models: Record<string, unknown>,
): Promise<void> => {
	const empty: string[] = [];
	for (const name of demoReferenceModels()) {
		const target = models[name];
		if (
			!isModelLike(target) ||
			await target.countDocument({ filter: {} }) === 0
		) {
			empty.push(name);
		}
	}
	if (empty.length === 0) return;
	return fail(
		`فرم‌های دمو به مدل‌های مرجعی نیاز دارند که هیچ رکوردی ندارند: ${
			empty.join("، ")
		}. ابتدا اکشن user.seedShared را اجرا کنید و بعد دوباره تلاش کنید.`,
	);
};

/**
 * سازمان باید بتواند فرم را واقعاً فعال کند، پیش از آنکه چیزی ساخته شود.
 *
 * `form_definition.*` گیت‌شده است: غیرفعال بودن یعنی
 * «این ماژول برای این نصب فعال نیست» یا «این ماژول برای این سازمان فعال نیست».
 * به‌جای ساختن چهار draft و بعداً خوردن به دیوار، همان اول بررسی می‌کنیم و پیام
 * فارسیِ دقیق می‌دهیم.
 *
 * **ماژول را روشن نمی‌کنیم.** `organization.module_flags` را فقط Ghost از راه
 * `organization.setModules` می‌نویسد؛ یک seeder با سطح Manager که خودش
 * مجوزدهی کند دارد مجوز پخش می‌کند. سازمانی که `module_flags` ندارد از نصب
 * ارث می‌برد و به‌طور پیش‌فرض روشن است، پس حالت معمول همین‌جاست و این خطا
 * فقط برای اپراتوری است که نصب خودش را محدود کرده.
 */
export const assertDemoFormsModuleOpen = async (
	organizationId: ObjectId,
): Promise<void> => {
	const effective = await getEffectiveKeysForOrg(organizationId.toString());
	if (effective.includes("forms")) return;
	return fail(
		`ماژول «forms» برای سازمان این دمو فعال نیست، پس فرم‌هایش قابل فعال‌سازی نیستند. ماژول را با اکشن organization.setModules (سطح Ghost) فعال کنید و بعد دوباره تلاش کنید.`,
	);
};

/** نتیجهٔ فعال‌سازی هر فرم، همان‌طور که در پاسخ اکشن برمی‌گردد. */
export type SeededForm = {
	_id: string;
	name: string;
	form_kind: string;
	icon: string;
	status: string;
	version: number;
	/** آیا در همین اجرا فعال شد، یا از قبل فعال بود و دست نخورد؟ */
	activated: boolean;
};

/**
 * فرم‌ها را برای یک سازمان می‌سازد و از راه **اکشن واقعی** `activate` فعال
 * می‌کند.
 *
 * چرا `activateFn` را مستقیم صدا نمی‌زنیم؟ چون `applyModuleGates` هر `fn` اکشنِ
 * گیت‌شده را در `functionsSetup` می‌پیچد؛ اگر مستقیم صدا بزنیم، seed دقیقاً
 * جایی موفق می‌شود که خودِ اپلیکیشن شکست می‌خورد — همان شکست خاموشی که نباید
 * اتفاق بیفتد. اکشن ثبت‌شده را از `getAtcsWithServices()` می‌گیریم و همان
 * `preAct` + `fn` را اجرا می‌کنیم که در ریکوئست واقعی اجرا می‌شود.
 *
 * ### نکتهٔ غیرتراکنشی — این را جدی بگیرید
 *
 * `activate` اول فرم فعال قبلیِ هم‌نوع را **بایگانی** می‌کند و بعد فرم تازه را
 * **فعال** می‌کند، آن هم بدون تراکنش. اگر بین این دو قدم برنامه بیفتد، سازمان
 * هیچ فرم فعال تصادفی ندارد و `getForPatrol` هم چیزی برای نمایش نمی‌دهد.
 * برای یک seed قابل قبول است (اجرای دوباره همین مشکل را خودش درست می‌کند)،
 * ولی این ریسک پنهان نیست و اینجاست تا بعداً کسی غافلگیر نشود.
 *
 * ### اجرای دوباره
 *
 * کلید یکتایی، سه‌تاییِ `(organization, form_kind, name)` است — همان چیزی که
 * `getForPatrol` و سازندهٔ فرم بر اساسش فهرست می‌گیرند.
 * - از قبل `active` است → **دست نمی‌زنیم**؛ `activate` با «فرم از قبل فعال
 *   است» رد می‌کند و اجرای دوباره می‌شکست.
 * - `draft` یا `archived` است → فعالش می‌کنیم. این همان مسیرِ «بازگردانی»
 *   است و باعث می‌شود اجرای دوباره بعد از فعال‌شدن یک فرم تصادف دیگر هم به
 *   حالت اول برگردد.
 * - تعریف موجود **هرگز بازنویسی نمی‌شود**: یک اپراتور ممکن است در سازندهٔ فرم
 *   آن را ویرایش کرده باشد و برگرداندنِ کارِ او از یک seed دمو بدتر از فرم
 *   کهنه است. فقط آنچه نیست ساخته می‌شود.
 */
export const activateDemoForms = async (args: {
	organizationId: ObjectId;
	registrer: ObjectId;
	models: Record<string, unknown>;
}): Promise<SeededForm[]> => {
	await assertDemoFormsModuleOpen(args.organizationId);
	await assertDemoReferenceModelsSeeded(args.models);

	const acts = getAtcsWithServices().main;
	const activateAct = acts.form_definition?.activate;
	if (!activateAct) {
		return fail("اکشن form_definition.activate ثبت نشده است.");
	}

	const seeded: SeededForm[] = [];

	// زنجیرهٔ احراز هویت یک بار، نه یک بار به‌ازای هر فرم: کارِ مستقل از حلقه
	// نبود نباید داخل حلقه بنشیند. سطح seed زیرمجموعهٔ سطح `activate` است پس
	// این اجباری نیست — وفاداری به مسیر واقعی اجرا همان چیزی است که دلیل وجودی
	// این تابع است، و گیتِ ماژول هم روی همین `fn` پیچیده شده.
	for (const pre of activateAct.preAct ?? []) await pre();

	for (const form of demoSeedForms()) {
		let row = await form_definition.findOne({
			filters: {
				"organization._id": args.organizationId,
				form_kind: form.form_kind,
				name: form.name,
			},
			projection: { _id: 1, status: 1, version: 1 },
		}) as unknown as
			| { _id: ObjectId; status?: string; version?: number }
			| null;

		if (!row) {
			// `insertOne` هیچ‌کدام از `defaulted(...)` را اعمال نمی‌کند، پس
			// `status`، `version`، `schema_version` و هر دو تاریخ صریح می‌روند.
			const created = await form_definition.insertOne({
				doc: {
					name: form.name,
					description: form.description,
					icon: form.icon,
					form_kind: form.form_kind,
					status: "draft",
					version: 1,
					schema_version: form.definition.schemaVersion,
					definition: form.definition,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				relations: {
					organization: {
						_ids: args.organizationId,
						relatedRelations: { form_definitions: true },
					},
					registrer: { _ids: args.registrer },
				},
				projection: { _id: 1 },
			});
			row = { _id: created!._id as ObjectId };
		}

		const alreadyActive = row.status === "active";
		if (!alreadyActive) {
			await activateAct.fn({
				service: "main",
				model: "form_definition",
				act: "activate",
				details: { set: { _id: row._id.toString() }, get: {} },
			});
		}

		const after = await form_definition.findOne({
			filters: { _id: row._id },
			projection: { _id: 1, status: 1, version: 1, icon: 1 },
		}) as unknown as {
			_id: ObjectId;
			status?: string;
			version?: number;
			icon?: string;
		} | null;

		if (!after) return fail(`فرم «${form.name}» پس از فعال‌سازی یافت نشد.`);

		seeded.push({
			_id: after._id.toString(),
			name: form.name,
			form_kind: form.form_kind,
			icon: after.icon ?? form.icon,
			status: after.status ?? "نامشخص",
			version: after.version ?? 1,
			activated: !alreadyActive,
		});
	}

	return seeded;
};
