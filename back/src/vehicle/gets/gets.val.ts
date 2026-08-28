import {
	boolean,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getVehiclesValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			plaque: optional(string()),
			title: optional(string()),
			is_active: optional(boolean()),
			patrolUnitId: optional(objectIdValidation),
		}),
		get: selectStruct("vehicle", 1),
	});
};
