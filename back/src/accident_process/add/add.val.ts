import { array, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { process_incident_type_emums, process_step_schema } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			organizationId: objectIdValidation,
			name: string(),
			description: optional(string()),
			incident_type: optional(process_incident_type_emums),
			steps: optional(array(process_step_schema)),
		}),
		get: selectStruct("accident_process", 1),
	});
};
