import { object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const assignShiftValidator = () => {
	return object({
		set: object({
			officerId: objectIdValidation,
			patrolUnitId: objectIdValidation,
			vehicleId: optional(objectIdValidation),
			shiftType: string(),
			note: optional(string()),
		}),
		get: selectStruct("shift", 2),
	});
};