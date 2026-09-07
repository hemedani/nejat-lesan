import { boolean, number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			// جست‌وجوی متن روی code / name / enName
			search: optional(string()),
			is_active: optional(boolean()),
		}),
		get: selectStruct("organization", 1),
	});
};
