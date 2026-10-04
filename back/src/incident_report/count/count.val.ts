import { enums, number, object, objectIdValidation, optional } from "@deps";

export const countValidator = () =>
	object({
		set: object({
			form_definition_id: optional(objectIdValidation),
			sync_status: optional(
				enums(["draft", "queued", "syncing", "synced", "rejected"]),
			),
			review_status: optional(
				enums([
					"submitted",
					"under_review",
					"returned",
					"approved",
					"completed",
				]),
			),
		}),
		get: object({ qty: optional(number()) }),
	});
