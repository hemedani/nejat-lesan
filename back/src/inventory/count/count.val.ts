import { number, object, objectIdValidation, optional, string } from "@deps";

export const countValidator = () => {
	return object({
		set: object({
			organizationId: optional(objectIdValidation),
			unitId: optional(objectIdValidation),
			wareId: optional(objectIdValidation),
			search: optional(string()),
		}),
		get: object({ qty: optional(number()) }),
	});
};
