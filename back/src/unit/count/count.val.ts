import { number, object, objectIdValidation, optional, string } from "@deps";

export const countValidator = () => {
	return object({
		set: object({
			search: optional(string()),
			organizationId: optional(objectIdValidation),
			roadId: optional(objectIdValidation),
			type: optional(string()),
		}),
		get: object({ qty: optional(number()) }),
	});
};
