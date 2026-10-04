import {
	any as anyStruct,
	object,
	objectIdValidation,
	optional,
	record,
	string,
} from "@deps";

/**
 * Validate a draft offline, before it is queued for sync.
 *
 * Takes the raw answer tree so the mobile client can ask "is what I have
 * fillable yet?" without a network round-trip per field change — and so the
 * server's answer, when it does get one, is computed by the *same* engine
 * function the client ran (`validateForm` from @lesan/form-engine).
 */
export const validateValidator = () =>
	object({
		set: object({
			_id: objectIdValidation,
			answers: record(string(), anyStruct()),
			/** Restrict the check to one page, for incremental per-page feedback. */
			pageKey: optional(string()),
		}),
		get: object({
			errors: optional(object({})),
			warnings: optional(object({})),
			blockedPages: optional(object({})),
			canSubmit: optional(object({})),
		}),
	});
