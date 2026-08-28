import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getVehicleValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
		}),
		get: selectStruct("vehicle", 1),
	});
};
