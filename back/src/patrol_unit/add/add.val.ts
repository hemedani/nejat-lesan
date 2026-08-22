import { array, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { patrol_unit_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...patrol_unit_pure,
			policeStationId: optional(objectIdValidation),
			vehicleIds: optional(array(objectIdValidation)),
			officerIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("patrol_unit", 1),
	});
};