import { enums, object, objectIdValidation, optional } from "@deps";

export const seedValidator = () => {
	return object({
		set: object({ fileID: objectIdValidation }),
		get: object({
			ok: optional(enums([0, 1])),
		}),
	});
};
