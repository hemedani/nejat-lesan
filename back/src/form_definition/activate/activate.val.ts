import { enums, object, objectIdValidation, optional, string } from "@deps";

export const activateValidator = () =>
	object({
		set: object({
			_id: objectIdValidation,
			/** Re-activate after an archive; kept for the "restore" affordance. */
			force: optional(string()),
		}),
		// `get` is a want-marker, not a projection — the fn returns the whole
		// payload and the framework never narrows it. Use the codebase idiom
		// (`enums([0, 1])`) so the `1` every client sends validates; declaring
		// `string()` here rejects it with "Expected a string, but received: 1".
		get: object({
			success: optional(enums([0, 1])),
			version: optional(enums([0, 1])),
			status: optional(enums([0, 1])),
			message: optional(enums([0, 1])),
		}),
	});
