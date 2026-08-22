import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const endShiftValidator = () => {
	return object({
		set: object({
			shiftId: objectIdValidation,
		}),
		get: selectStruct("shift", 2),
	});
};