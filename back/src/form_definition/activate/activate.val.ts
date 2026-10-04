import { number, object, objectIdValidation, optional, string } from "@deps";

export const activateValidator = () =>
	object({
		set: object({
			_id: objectIdValidation,
			/** Re-activate after an archive; kept for the "restore" affordance. */
			force: optional(string()),
		}),
		// `version` is a number: it is the definition version the client compares
		// its draft against to detect that a published form changed underfoot.
		get: object({
			success: optional(number()),
			version: optional(number()),
			status: optional(string()),
			message: optional(string()),
		}),
	});
