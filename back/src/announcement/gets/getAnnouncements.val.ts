import { number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getAnnouncementsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			priority: optional(string()),
			is_active: optional(string()),
		}),
		get: selectStruct("announcement", 1),
	});
};
