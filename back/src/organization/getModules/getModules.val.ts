import { enums, object, objectIdValidation, optional } from "@deps";

export const getModulesValidator = () => {
	return object({
		set: object({
			organizationId: objectIdValidation,
		}),
		get: object({
			deployment: optional(enums([0, 1])),
			modules: optional(enums([0, 1])),
			effective: optional(enums([0, 1])),
		}),
	});
};
