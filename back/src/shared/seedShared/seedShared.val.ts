import { enums, object, optional } from "@deps";

export const seedSharedValidator = () => {
	return object({
		set: object({}),
		get: object({
			added: optional(enums([0, 1])),
			totalAdded: optional(enums([0, 1])),
		}),
	});
};