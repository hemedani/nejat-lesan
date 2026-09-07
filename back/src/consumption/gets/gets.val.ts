import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			unitId: optional(objectIdValidation),
			wareId: optional(objectIdValidation),
		}),
		get: selectStruct("consumption", 1),
	});
};
