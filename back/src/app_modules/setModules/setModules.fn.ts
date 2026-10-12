import { type ActFn } from "@deps";
import { defaultModuleRows } from "../constants.ts";
import { setModuleConfig } from "../moduleConfig.ts";

export const setModulesFn: ActFn = async (body) => {
	const {
		set: { modules },
	} = body.details;
	// نیامدنِ `modules` = پیش‌فرض (همه فعال). setModuleConfig خودش هم کلیدهای
	// نیامده را «فعال» می‌گیرد، پس سند همیشه برای هر کلیدِ MODULE_KEYS ردیف دارد.
	await setModuleConfig(modules ?? defaultModuleRows());
	return { success: true };
};
