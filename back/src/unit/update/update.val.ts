import {
	array,
	boolean,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";
import { unit_type_emums } from "@model";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			code: optional(string()),
			name: optional(string()),
			description: optional(string()),
			is_active: optional(boolean()),
			type: optional(unit_type_emums),
			address: optional(string()),
			phone: optional(string()),
			head_title: optional(string()),
			features: optional(array(object({ feature: optional(string()) }))),
		}),
		get: selectStruct("unit", 1),
	});
};
