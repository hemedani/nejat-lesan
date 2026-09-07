import { array, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { process_incident_type_emums, process_step_schema } from "@model";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			description: optional(string()),
			incident_type: optional(process_incident_type_emums),
			// builder کل پیش‌نویس را یکجا ذخیره می‌کند (جایگزینی کل steps)
			steps: optional(array(process_step_schema)),
		}),
		get: selectStruct("accident_process", 1),
	});
};
