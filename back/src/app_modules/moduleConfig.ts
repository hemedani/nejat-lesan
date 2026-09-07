import { ObjectId } from "@deps";
import { coreApp, getAtcsWithServices, module_config, unit } from "../../mod.ts";
import { throwError, type MyContext } from "@lib";
import {
	MODULE_KEYS,
	MSG_MODULE_DEPLOY_DISABLED,
	MSG_MODULE_ORG_DISABLED,
	type ModuleKey,
} from "./constants.ts";
import { getScopedOrgIds } from "./orgScope.ts";
import { getOrgModuleRows, isOrgFlagEnabled } from "./orgModules.ts";

export { MODULE_KEYS, type ModuleKey };

/**
 * پیکربندی و گیت مرکزی ماژول‌ها (دو سطح: نصب + سازمان). فقط Ghost تنظیم می‌کند.
 *
 * ماژول‌های فروشی:
 *  - charts          : تحلیل و نمودار تصادفات (analytics + نقشه‌های تحت وب)
 *  - incident_patrol : ثبت رخداد موبایل + داشبورد/بررسی گشت + اورژانس/شیفت/اعلامیه
 *  - warehouse       : مدیریت انبار (JIT)
 * هر چیزی که در هیچ ماژولی نیست = هسته (core) و همیشه فعال می‌ماند.
 *
 * گیت سطح نصب: وقتی ماژولی در کل نصب خاموش است، برای همه (جز Ghost) رد می‌شود.
 * گیت سطح سازمان (تنها وقتی نصب فعال باشد): وقتی ماژول برای سازمانِ هدفِ درخواست
 * خاموش باشد، رد می‌شود — شامل Manager وقتی orgId/unitId صریح به سازمانِ خاموش
 * اشاره دارد؛ فقط Ghost مستثناست. کاربرِ بدون scope سازمانی (Manager سراسری)
 * فقط گیت نصب را دارد.
 */

const CONFIG_KEY = "app_modules";

// --- نگاشت اکشن‌ها → ماژول (الگوها: "schema.act" یا "schema.*") ---

const CHART_ANALYTICS = [
	"accident.accidentSeverityAnalytics",
	"accident.areaUsageAnalytics",
	"accident.collisionAnalytics",
	"accident.companyPerformanceAnalytics",
	"accident.eventCollisionAnalytics",
	"accident.eventSeverityAnalytics",
	"accident.hourlyDayOfWeekAnalytics",
	"accident.humanReasonAnalytics",
	"accident.monthlyHolidayAnalytics",
	"accident.roadDefectsAnalytics",
	"accident.roadDefectsAnalyticsWithCount",
	"accident.spatialCollisionAnalytics",
	"accident.spatialLightAnalytics",
	"accident.spatialSafetyIndexAnalytics",
	"accident.spatialSeverityAnalytics",
	"accident.spatialSingleVehicleAnalytics",
	"accident.temporalCollisionAnalytics",
	"accident.temporalCountAnalytics",
	"accident.temporalDamageAnalytics",
	"accident.temporalNightAnalytics",
	"accident.temporalSeverityAnalytics",
	"accident.temporalTotalReasonAnalytics",
	"accident.temporalUnlicensedDriversAnalytics",
	"accident.totalReasonAnalytics",
	"accident.vehicleReasonAnalytics",
	// پشتیبان نمودار/نقشه تحت وب
	"accident.getCreatedAtPeriods",
	"accident.mapAccidents",
];

// اکشن‌های ماژول گشت/ثبت رخداد که روی schema های مشترک (accident/file/user) هستند.
const INCIDENT_ACCIDENT = [
	"accident.getMyReports",
	"accident.getSyncStatus",
	"accident.reviewReport",
	"accident.reviewHistory",
	"accident.resubmitReport",
	"accident.getReporterDashboard",
	"accident.getManagerDashboard",
	"accident.getManagerReports",
	"accident.nearbyAccidents",
];
const INCIDENT_SCHEMAS = [
	"emergency",
	"shift",
	"vehicle",
	"police_station",
	"patrol_unit",
	"patrol_operations",
	"accident_process",
	"announcement",
];

const WAREHOUSE_SCHEMAS = [
	"ware",
	"inventory",
	"consumption",
	"goods_receipt",
	"stock_movement",
	"goods_request",
];

const MODULE_PATTERNS: Record<ModuleKey, string[]> = {
	charts: CHART_ANALYTICS,
	incident_patrol: [
		...INCIDENT_ACCIDENT,
		"file.uploadAccidentImages",
		"user.getPatrolOfficers",
		...INCIDENT_SCHEMAS.map((s) => `${s}.*`),
	],
	warehouse: WAREHOUSE_SCHEMAS.map((s) => `${s}.*`),
};

// ---------------------------------------------------------------------------

let enabledModules: Set<string> = new Set(MODULE_KEYS);

export const getEnabledModuleKeys = (): string[] => [...enabledModules];

export const isModuleEnabled = (key: string): boolean => enabledModules.has(key);

const moduleKeyFor = (schema: string, actName: string): ModuleKey | null => {
	for (const key of MODULE_KEYS) {
		const patterns = MODULE_PATTERNS[key];
		if (patterns.includes(`${schema}.${actName}`)) return key;
		if (patterns.includes(`${schema}.*`)) return key;
	}
	return null;
};

/** خواندن پیکربندی از دیتابیس (یک بار در بوت و پس از هر تغییر). */
const refreshEnabledSet = async (): Promise<void> => {
	const doc = await module_config.findOne({
		filters: { key: CONFIG_KEY },
		projection: { modules: 1 },
	});
	if (!doc?.modules?.length) {
		enabledModules = new Set(MODULE_KEYS);
		return;
	}
	enabledModules = new Set(
		(doc.modules as Array<{ key: string; enabled: boolean }>)
			.filter((m) => m.enabled)
			.map((m) => m.key),
	);
};

/**
 * اولین بوت: اگر سند پیکربندی نیست، از ENABLED_MODULES (پیش‌فرض: همه) می‌سازد.
 * باید قبل از هر درخواست اجرا شود (mod.ts در بوت صدا می‌زند).
 */
export const ensureModuleConfig = async (): Promise<void> => {
	const existing = await module_config.findOne({
		filters: { key: CONFIG_KEY },
		projection: { _id: 1 },
	});
	if (existing) {
		await refreshEnabledSet();
		return;
	}
	const raw = Deno.env.get("ENABLED_MODULES");
	const requested = raw
		? raw.split(",").map((s) => s.trim()).filter(Boolean)
		: [...MODULE_KEYS];
	await module_config.insertOne({
		doc: {
			key: CONFIG_KEY,
			modules: MODULE_KEYS.map((key) => ({
				key,
				enabled: requested.includes(key),
			})),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1 },
	});
	await refreshEnabledSet();
};

/** ذخیره‌سازی از طریق اکشن Ghost (setModules). */
export const setModuleConfig = async (
	modules: Array<{ key: string; enabled: boolean }>,
): Promise<void> => {
	await module_config.findOneAndUpdate({
		filter: { key: CONFIG_KEY },
		update: {
			$set: {
				modules,
				updatedAt: new Date(),
			},
		},
		projection: { _id: 1 },
	});
	await refreshEnabledSet();
};

export const getModuleConfigRows = async (): Promise<
	Array<{ key: string; enabled: boolean }>
> => {
	const doc = await module_config.findOne({
		filters: { key: CONFIG_KEY },
		projection: { modules: 1 },
	});
	const rows = (doc?.modules || []) as Array<{ key: string; enabled: boolean }>;
	// ترتیب ثابت + کلیدهای ناقص
	return MODULE_KEYS.map((key) => ({
		key,
		enabled: rows.find((r) => r.key === key)?.enabled ?? true,
	}));
};

/** کلیدهای مؤثر یک سازمان = فعالِ نصب ∩ فعالِ سازمان (غیاب flag = فعال). */
export const getEffectiveKeysForOrg = async (orgId: string): Promise<string[]> => {
	const rows = await getOrgModuleRows(orgId);
	return MODULE_KEYS.filter(
		(key) => enabledModules.has(key) && (rows.find((r) => r.key === key)?.enabled ?? true),
	);
};

/**
 * شناسه‌ی سازمانِ تکیِ یک کاربر (برای ورود/getMe). اگر کاربر دقیقاً به یک سازمان
 * scope دارد (نقش organization/unit، مأمور گشتِ یک واحد، یا head انبار) آن را برمی‌گرداند؛
 * در غیر این صورت null (کاربر سراسری/چندسازمانی → ماژول‌های سطح نصب کافی است).
 */
export const resolvePrimaryOrgId = async (
	user: { _id: unknown; level?: string; roles?: Array<{ scopeType?: string; scopeId?: string }> },
): Promise<string | null> => {
	const ids = await getScopedOrgIds(user);
	return ids.length === 1 ? ids[0] : null;
};

/** کلیدهای مؤثر سازمانِ تکیِ کاربر (برای پیوستن به getMe/login). */
export const getPrimaryOrgModules = async (
	user: { _id: unknown; level?: string; roles?: Array<{ scopeType?: string; scopeId?: string }> },
): Promise<string[] | null> => {
	const orgId = await resolvePrimaryOrgId(user);
	return orgId ? await getEffectiveKeysForOrg(orgId) : null;
};

// ---------------------------------------------------------------------------

/**
 * گیت سطح نصب: در ابتدای fn اکشن اجرا می‌شود. چون fn آخرین مرحله است،
 * context.user (اگر preAct/preValidation setUser اجرا کرده باشند) آماده است و
 * Ghost همیشه مجاز است.
 */
const assertModuleOpen = (moduleKey: ModuleKey) => {
	if (enabledModules.has(moduleKey)) return;
	const ctx = coreApp.contextFns.getContextModel() as MyContext;
	if (ctx.user?.level === "Ghost") return;
	throwError(MSG_MODULE_DEPLOY_DISABLED);
};

// پارامترهایی که در set اکشن، سازمانِ هدفِ درخواست را مشخص می‌کنند.
const ORG_ID_PARAMS = ["organizationId", "orgId"];
const UNIT_OWNER_PARAMS = ["unitId", "fromUnitId", "receivingUnitId", "warehouseUnitId"];

/** سازمان‌های صریحِ هدف از روی set (واحدها → organization شان). */
const resolveExplicitOrgs = async (set: Record<string, unknown>): Promise<string[]> => {
	const out = new Set<string>();
	for (const p of ORG_ID_PARAMS) {
		const v = set?.[p];
		if (v) out.add(String(v));
	}
	const unitIds = UNIT_OWNER_PARAMS
		.map((p) => set?.[p])
		.filter((v): v is string | ObjectId => Boolean(v))
		.map((v) => String(v));
	if (unitIds.length) {
		const units = await unit
			.find({
				filters: { _id: { $in: unitIds.map((id) => new ObjectId(id)) } },
				projection: { "organization._id": 1 },
			})
			.toArray();
		for (const u of units) {
			const oid = (u as any).organization?._id as ObjectId | undefined;
			if (oid) out.add(oid.toString());
		}
	}
	return [...out];
};

/**
 * گیت سطح سازمان (فقط وقتی نصب فعال باشد صدا زده می‌شود).
 * - هدفِ صریح (orgId/organizationId/unit…) موجود باشد: اگر همه‌ی آن سازمان‌ها ماژول را
 *   خاموش دارند رد می‌شود — شامل Manager (فقط Ghost مستثناست).
 * - بدون هدفِ صریح: اگر کاربر scope سازمانی دارد و در هیچ‌کدام از سازمان‌هایش ماژول فعال
 *   نیست رد می‌شود؛ کاربر سراسری (Manager/Ghost بدون scope) فقط گیت نصب را دارد.
 */
const assertOrgModuleOpen = async (moduleKey: ModuleKey, body: unknown): Promise<void> => {
	const ctx = coreApp.contextFns.getContextModel() as MyContext;
	if (!ctx.user) return; // اکشن عمومی بدون کاربر → فقط گیت نصب اعمال شده است
	if (ctx.user.level === "Ghost") return;
	const set = ((body as any)?.details?.set || {}) as Record<string, unknown>;

	const explicit = await resolveExplicitOrgs(set);
	if (explicit.length > 0) {
		const flags = await Promise.all(
			explicit.map(async (orgId) => ({
				orgId,
				open: await isOrgFlagEnabled(orgId, moduleKey),
			})),
		);
		if (flags.every((f) => !f.open)) throwError(MSG_MODULE_ORG_DISABLED);
		return;
	}

	const scoped = await getScopedOrgIds(ctx.user);
	if (scoped.length === 0) return; // کاربر سراسری بدون هدف صریح
	const anyOpen = (await Promise.all(
		scoped.map(async (orgId) => isOrgFlagEnabled(orgId, moduleKey)),
	)).some(Boolean);
	if (!anyOpen) throwError(MSG_MODULE_ORG_DISABLED);
};

/**
 * تزریق گیت (نصب + سازمان) به همه اکشن‌های ثبت‌شده (پایان functionsSetup).
 * بدون تغییر فایل اکشن‌ها؛ fn هر اکشن نگاشت‌شده در یک wrapper می‌پیچد.
 */
export const applyModuleGates = (): void => {
	const services = getAtcsWithServices().main;
	for (const schema of Object.keys(services)) {
		for (const actName of Object.keys(services[schema])) {
			const act = services[schema][actName] as { fn: (b: any) => Promise<unknown> };
			const moduleKey = moduleKeyFor(schema, actName);
			if (!moduleKey) continue;
			const originalFn = act.fn;
			act.fn = async (body) => {
				assertModuleOpen(moduleKey);
				await assertOrgModuleOpen(moduleKey, body);
				return await originalFn(body);
			};
		}
	}
};
