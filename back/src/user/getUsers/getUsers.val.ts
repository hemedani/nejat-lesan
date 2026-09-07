import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { user_level_emums } from "@model";

export const getUsersValidator = () => {
	return object({
		set: object({
			levels: optional(user_level_emums),
			organizationId: optional(objectIdValidation),
			search: optional(string()),
			page: number(),
			limit: number(),
		}),
		get: selectStruct("user", 2),
	});
};
