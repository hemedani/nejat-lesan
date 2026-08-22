import { boolean, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			code: optional(string()),
			name: optional(string()),
			is_active: optional(boolean()),
		}),
		get: selectStruct("patrol_unit", 1),
	});
};