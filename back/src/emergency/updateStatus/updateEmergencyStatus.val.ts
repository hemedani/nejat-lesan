import { object, objectIdValidation, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateEmergencyStatusValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			status: string(),
		}),
		get: selectStruct("emergency", 1),
	});
};
