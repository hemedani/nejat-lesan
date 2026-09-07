import { type ActFn } from "@deps";
import { setModuleConfig } from "../moduleConfig.ts";

export const setModulesFn: ActFn = async (body) => {
	const {
		set: { modules },
	} = body.details;
	await setModuleConfig(modules);
	return { success: true };
};
