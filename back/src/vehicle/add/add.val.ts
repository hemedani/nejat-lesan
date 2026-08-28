import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { vehicle_pure } from "@model";

export const addVehicleValidator = () => {
	return object({
		set: object({
			...vehicle_pure,
			colorId: optional(objectIdValidation),
			plaqueTypeId: optional(objectIdValidation),
			systemTypeId: optional(objectIdValidation),
		}),
		get: selectStruct("vehicle", 1),
	});
};
