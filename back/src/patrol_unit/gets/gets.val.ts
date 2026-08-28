import { boolean, number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			code: optional(string()),
			name: optional(string()),
			is_active: optional(boolean()),
		}),
		get: selectStruct("patrol_unit", 2),
	});
};
