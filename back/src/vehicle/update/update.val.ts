import {
	array,
	boolean,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateVehicleValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			plaque_no: optional(array(string())),
			title: optional(string()),
			is_active: optional(boolean()),
		}),
		get: selectStruct("vehicle", 1),
	});
};
