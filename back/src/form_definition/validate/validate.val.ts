import {
	any as anyStruct,
	enums,
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
		// Want-markers, not projections: the fn returns the ad-hoc result whole
		// (see the `void get` there), so the codebase idiom `enums([0, 1])` is
		// what keeps a client's `1` valid instead of "Expected an object".
		get: object({
			errors: optional(enums([0, 1])),
			warnings: optional(enums([0, 1])),
			blockedPages: optional(enums([0, 1])),
			canSubmit: optional(enums([0, 1])),
		}),
	});
