import { type ActFn } from "@deps";
import { defaultModuleRows } from "../../app_modules/constants.ts";
import { setOrgModuleFlags } from "../../app_modules/orgModules.ts";

export const setModulesFn: ActFn = async (body) => {
	const {
		set: { organizationId, modules },
	} = body.details;
	// نیامدنِ `modules` = پیش‌فرض (همه فعال).
	await setOrgModuleFlags(
		organizationId as string,
		modules ?? defaultModuleRows(),
	);
	return { success: true };
};
