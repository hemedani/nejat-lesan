import { array, number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			name: optional(string()),
			names: optional(array(string())),
		}),
		get: selectStruct("equipment_damage", 2),
	});
};
