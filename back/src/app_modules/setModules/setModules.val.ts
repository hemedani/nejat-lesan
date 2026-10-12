import { array, boolean, enums, object, optional } from "@deps";
import { MODULE_KEYS } from "../moduleConfig.ts";

/**
 * `modules` **اختیاری** است. نیامدنش یعنی «پیش‌فرض» (همه فعال — defaultModuleRows)
 * و پیش‌فرض در fn اعمال می‌شود، نه با `defaulted`.
 *
 * چرا `optional` و نه `defaulted`: runType این اکشن پیش‌فرضِ فریم‌ورک یعنی
 * "assert" است و `defaulted` تنها در runType "create" (که create/coerce اجرا
 * می‌شود) مقدار جایگزین را می‌گذارد. با "assert" فقط اعتبارسنجی می‌شود، پس
 * `defaulted` هم مثل `array` خالی روی undefined رد می‌کرد و همان خطای
 * «Expected an array value, but received: undefined» برمی‌گشت.
 */
export const setModulesValidator = () => {
	return object({
		set: object({
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
