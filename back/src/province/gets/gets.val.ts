import { number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			name: optional(string()),
		}),
		get: selectStruct("province", 2),
	});
};
