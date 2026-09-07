import { boolean, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			code: optional(string()),
			name: optional(string()),
			enName: optional(string()),
			description: optional(string()),
			is_active: optional(boolean()),
			headId: optional(objectIdValidation),
			logoId: optional(objectIdValidation),
		}),
		get: selectStruct("organization", 1),
	});
};
