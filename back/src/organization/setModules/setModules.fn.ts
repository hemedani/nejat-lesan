import { type ActFn } from "@deps";
import { setOrgModuleFlags } from "../../app_modules/orgModules.ts";

export const setModulesFn: ActFn = async (body) => {
	const {
		set: { organizationId, modules },
	} = body.details;
	await setOrgModuleFlags(organizationId as string, modules);
	return { success: true };
};
