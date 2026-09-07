import {
	array,
	object,
	objectIdValidation,
	optional,
} from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			organizationId: optional(objectIdValidation),
			roadId: optional(objectIdValidation),
			parentUnitId: optional(objectIdValidation),
			headId: optional(objectIdValidation),
			// چندتایی‌ها: افزودن / حذف
			officerIds: optional(array(objectIdValidation)),
			removeOfficerIds: optional(array(objectIdValidation)),
			vehicleIds: optional(array(objectIdValidation)),
			removeVehicleIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("unit", 1),
	});
};
