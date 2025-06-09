import { enums, object, optional } from "@deps";

export const seedValidator = () => {
	return object({
		set: object({}),
		get: object({
			ok: optional(enums([0, 1])),
		}),
	});
};
