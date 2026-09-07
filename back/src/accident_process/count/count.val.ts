import { number, object, objectIdValidation, optional, string } from "@deps";

export const countValidator = () => {
	return object({
		set: object({
			organizationId: optional(objectIdValidation),
			status: optional(string()),
			incident_type: optional(string()),
		}),
		get: object({ qty: optional(number()) }),
	});
};
