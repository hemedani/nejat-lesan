import { number, object, objectIdValidation, optional } from "@deps";

export const countValidator = () => {
	return object({
		set: object({
			unitId: optional(objectIdValidation),
			wareId: optional(objectIdValidation),
		}),
		get: object({ qty: optional(number()) }),
	});
};
