import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getActiveShiftValidator = () => {
	return object({
		set: object({
			userId: optional(objectIdValidation),
		}),
		get: selectStruct("shift", 2),
	});
};