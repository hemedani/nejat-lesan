import { boolean, number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getPatrolOfficersValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			is_active: optional(boolean()),
			search: optional(string()),
		}),
		// فقط رابطه معکوس patrol_unit با عمق ۱ مجاز است؛ بقیه روابط سنگین مسدودند
		get: selectStruct("user", {
			patrol_unit: 1,
			avatar: 0,
			national_card: 0,
			devices: 0,
			police_station: 0,
			accidents: 0,
			shifts: 0,
			uploadedAssets: 0,
		}),
	});
};
