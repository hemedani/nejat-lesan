import { array, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { accidentSetSchema } from "../accidentSetSchema.ts";

export const updateValidator = () => {
	return object({
		set: object({
			// Lookup: provide at least one of `_id` or `client_report_uuid`
			// (`client_report_uuid` itself is part of accidentSetSchema below)
			_id: optional(objectIdValidation),

			// All pure fields are optional for update
			...accidentSetSchema.schema,

			// Files the client already uploaded, to be linked into the report's
			// `attachments` relation. `add` accepts this key and `update` must
			// too: a correction that adds a photo goes through `update`, and
			// without it the upload would succeed and then never appear in the
			// gallery. It is not part of `accidentSetSchema` because it is a
			// relation, not a pure field — it is stripped from `$set` and
			// written through `addRelation` instead.
			attachmentsIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("accident", 1),
	});
};
