import { array, boolean, enums, object, optional } from "@deps";
import { MODULE_KEYS } from "../moduleConfig.ts";

export const setModulesValidator = () => {
	return object({
		set: object({
			modules: array(object({
				key: enums([...MODULE_KEYS] as string[]),
				enabled: boolean(),
			})),
		}),
		get: object({
			success: optional(enums([0, 1])),
		}),
	});
};
