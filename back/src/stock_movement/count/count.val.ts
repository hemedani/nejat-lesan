import { number, object, objectIdValidation, optional, string } from "@deps";

export const countValidator = () => {
	return object({
		set: object({
			unitId: optional(objectIdValidation),
			wareId: optional(objectIdValidation),
			reason: optional(string()),
		}),
		get: object({ qty: optional(number()) }),
	});
};
