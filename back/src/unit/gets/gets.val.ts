import { boolean, number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { unit_type_emums } from "@model";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			// جست‌وجوی متن روی code / name
			search: optional(string()),
			organizationId: optional(objectIdValidation),
			roadId: optional(objectIdValidation),
			type: optional(unit_type_emums),
			parentUnitId: optional(objectIdValidation),
			headId: optional(objectIdValidation),
			is_active: optional(boolean()),
		}),
		get: selectStruct("unit", 1),
	});
};
