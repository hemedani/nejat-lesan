import { object, objectIdValidation, optional } from "@deps";
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
		}),
		get: selectStruct("accident", 1),
	});
};