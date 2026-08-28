import { enums, number, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getEmergenciesValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			status: optional(enums(["active", "acknowledged", "resolved"])),
			officerId: optional(objectIdValidation),
		}),
		get: selectStruct("emergency", 1),
	});
};
