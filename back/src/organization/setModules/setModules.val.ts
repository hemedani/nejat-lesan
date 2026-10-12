import { array, boolean, enums, object, objectIdValidation, optional } from "@deps";
import { MODULE_KEYS } from "../../app_modules/moduleConfig.ts";

/**
 * `modules` اختیاری است (مثل app_modules.setModules): نیامدنش = پیش‌فرض
 * (همه فعال — defaultModuleRows). چون «غیابِ پرچم» هم در orgModules به معنای
 * فعال/ارث‌بری از نصب است، پیش‌فرض با رفتار خواندن هم‌داستان می‌ماند.
 * پیش‌فرض در fn اعمال می‌شود چون runType پیش‌فرض "assert" است و `defaulted`
 * فقط در runType "create" مقدار می‌گذارد.
 */
export const setModulesValidator = () => {
	return object({
		set: object({
			organizationId: objectIdValidation,
			modules: optional(array(object({
				key: enums([...MODULE_KEYS] as string[]),
				enabled: boolean(),
			}))),
		}),
		get: object({
			success: optional(enums([0, 1])),
		}),
	});
};
