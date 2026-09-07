import { enums, object, optional } from "@deps";

export const getModulesValidator = () => {
	return object({
		set: object({}),
		get: object({
			modules: optional(enums([0, 1])),
		}),
	});
};
