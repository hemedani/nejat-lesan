import { ObjectId } from "@deps";
import { organization } from "../../mod.ts";
import { MODULE_KEYS, type ModuleKey } from "./constants.ts";

/**
 * پرچم‌های ماژول به‌ازای هر سازمان (روی سند organization.module_flags).
 * غیاب = ارث‌بری از سطح نصب (همه‌ی ماژول‌های فعالِ نصب، برای این سازمان فعال‌اند).
 * مؤثر(org, key) = فعال در نصب  AND  (پرچم سازمان موجود نباشد یا enabled باشد).
 *
 * خواندن هر organization یک findOne کوچک است؛ با کش حافظه ساده جبران می‌شود که
 * با organization.setModules نامعتبر می‌شود.
 */

type FlagRow = { key: string; enabled: boolean };

const cache = new Map<string, FlagRow[]>();

export const invalidateOrgModules = (orgId: string): void => {
	cache.delete(orgId);
};

const loadOrgFlags = async (orgId: string): Promise<FlagRow[]> => {
	const cached = cache.get(orgId);
	if (cached) return cached;
	const org = await organization.findOne({
		filters: { _id: new ObjectId(orgId) },
		projection: { module_flags: 1 },
	});
	const rows = ((org as any)?.module_flags || []) as FlagRow[];
	// ترتیب ثابت + مقادیر پیش‌فرض (غیاب = enabled)
	const normalized = MODULE_KEYS.map((key) => ({
		key,
		enabled: rows.find((r) => r.key === key)?.enabled ?? true,
	}));
	cache.set(orgId, normalized);
	return normalized;
};

/** پرچم صریح سازمان (فقط flag ها، بدون اعمال سطح نصب). غیاب = enabled برای همه. */
export const getOrgModuleRows = async (orgId: string): Promise<FlagRow[]> => {
	return await loadOrgFlags(orgId);
};

/** آیا سازمانی این ماژول را (در سطح سازمان) فعال دارد؟ (بدون درنظرگرفتن نصب) */
export const isOrgFlagEnabled = async (
	orgId: string,
	key: string,
): Promise<boolean> => {
	const rows = await loadOrgFlags(orgId);
	return rows.find((r) => r.key === key)?.enabled ?? true;
};

/** ذخیره flag های یک سازمان (فقط Ghost از طریق organization.setModules). */
export const setOrgModuleFlags = async (
	orgId: string,
	modules: Array<{ key: string; enabled: boolean }>,
): Promise<void> => {
	await organization.findOneAndUpdate({
		filter: { _id: new ObjectId(orgId) },
		update: {
			$set: {
				module_flags: modules,
				updatedAt: new Date(),
			},
		},
		projection: { _id: 1 },
	});
	invalidateOrgModules(orgId);
};

// برای مصرف moduleConfig (تا وابستگی به ارگانیزیشن در همان‌جا نباشد)
export { MODULE_KEYS, type ModuleKey };
