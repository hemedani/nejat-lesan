import { enums, object, objectIdValidation, optional } from "@deps";

export const duplicateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
		}),
		get: object({
			_id: optional(enums([0, 1])),
			name: optional(enums([0, 1])),
			status: optional(enums([0, 1])),
			version: optional(enums([0, 1])),
		}),
	});
};
