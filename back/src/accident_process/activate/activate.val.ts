import { enums, object, objectIdValidation, optional } from "@deps";

export const activateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
		}),
		get: object({
			success: optional(enums([0, 1])),
			version: optional(enums([0, 1])),
			status: optional(enums([0, 1])),
			message: optional(enums([0, 1])),
		}),
	});
};
