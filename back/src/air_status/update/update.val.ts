import { object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
		}),
		get: selectStruct("air_status", 1),
	});
};
