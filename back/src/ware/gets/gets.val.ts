import { boolean, number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			search: optional(string()),
			ware_type: optional(string()),
			ware_class: optional(string()),
			ware_group: optional(string()),
			ware_model: optional(string()),
			is_active: optional(boolean()),
		}),
		get: selectStruct("ware", 1),
	});
};
