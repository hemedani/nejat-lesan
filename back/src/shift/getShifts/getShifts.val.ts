import { number, object, objectIdValidation, optional, string, enums } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { shift_status_emums } from "@model";

export const getShiftsValidator = () => {
	return object({
		set: object({
			userId: optional(objectIdValidation),
			patrolUnitId: optional(objectIdValidation),
			page: number(),
			limit: number(),
			status: optional(shift_status_emums),
		}),
		get: selectStruct("shift", 2),
	});
};
