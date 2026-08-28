import { boolean, number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			name: optional(string()),
			is_active: optional(boolean()),
		}),
		get: selectStruct("police_station", 1),
	});
};
