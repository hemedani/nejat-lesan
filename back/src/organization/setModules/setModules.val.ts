import { array, boolean, enums, object, objectIdValidation, optional } from "@deps";
import { MODULE_KEYS } from "../../app_modules/moduleConfig.ts";

export const setModulesValidator = () => {
	return object({
		set: object({
			organizationId: objectIdValidation,
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
