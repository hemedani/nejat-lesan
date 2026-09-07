import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const adjustValidator = () => {
	return object({
		set: object({
			unitId: objectIdValidation,
			wareId: objectIdValidation,
			quantity: number(),
			reason: optional(string()),
		}),
		get: selectStruct("inventory", 1),
	});
};
