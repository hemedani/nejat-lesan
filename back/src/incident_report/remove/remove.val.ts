import { boolean, object, objectIdValidation, optional } from "@deps";

export const removeValidator = () =>
	object({
		set: object({
			_id: objectIdValidation,
			hardCascade: optional(boolean()),
		}),
		get: object({ success: optional(boolean()) }),
	});
