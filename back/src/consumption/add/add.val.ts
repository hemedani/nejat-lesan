import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
	return object({
		set: object({
			wareId: objectIdValidation,
			quantity: number(),
			unitId: optional(objectIdValidation),
			reason: optional(string()),
			consumed_for: optional(string()),
			notes: optional(string()),
			consumed_at: optional(string()),
		}),
		get: selectStruct("consumption", 1),
	});
};
