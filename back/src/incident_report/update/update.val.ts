import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { incident_report_set_schema } from "../setSchema.ts";

/**
 * `update` accepts the whole report payload, not a patch: the mobile correction
 * flow re-sends everything it holds. So it mirrors `add`'s set schema rather than
 * requiring the author to know which fields changed.
 */
export const updateValidator = () =>
	object({
		set: object({
			// Lookup by server id, or by the client uuid for idempotent corrections.
			_id: optional(objectIdValidation),
			...incident_report_set_schema,
		}),
		get: selectStruct("incident_report", 1),
	});
