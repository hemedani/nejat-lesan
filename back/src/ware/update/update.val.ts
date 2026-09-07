import {
	boolean,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			enName: optional(string()),
			brand: optional(string()),
			price: optional(number()),
			irc: optional(string()),
			gtin: optional(string()),
			photo_url: optional(string()),
			ware_type: optional(string()),
			ware_class: optional(string()),
			ware_group: optional(string()),
			ware_model: optional(string()),
			manufacturer: optional(string()),
			lead_time_days: optional(number()),
			is_active: optional(boolean()),
		}),
		get: selectStruct("ware", 1),
	});
};
