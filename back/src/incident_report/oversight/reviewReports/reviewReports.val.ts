import {
	array,
	enums,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";

export const reviewReportsValidator = () =>
	object({
		set: object({
			reportIds: array(objectIdValidation),
			action: enums(["start_review", "return", "approve", "complete"]),
			reason: optional(string()),
		}),
		// Empty on purpose: the batch answers with its own per-row results, so a
		// client cannot widen what comes back.
		get: object({}),
	});
