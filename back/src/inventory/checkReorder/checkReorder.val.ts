import { enums, number, object, objectIdValidation, optional } from "@deps";

export const checkReorderValidator = () => {
	return object({
		set: object({
			unitId: optional(objectIdValidation),
			organizationId: optional(objectIdValidation),
		}),
		get: object({
			created: optional(number()),
			skipped: optional(number()),
			rows: optional(enums([0, 1])),
		}),
	});
};
