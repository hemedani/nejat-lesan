import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import {
	accident_process_status_emums,
	process_incident_type_emums,
} from "@model";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			organizationId: optional(objectIdValidation),
			status: optional(accident_process_status_emums),
			incident_type: optional(process_incident_type_emums),
			search: optional(string()),
		}),
		get: selectStruct("accident_process", 1),
	});
};
