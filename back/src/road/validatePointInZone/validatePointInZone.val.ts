import { enums, object, objectIdValidation, optional } from "@deps";
import { geoJSONStruct } from "@model";

export const validatePointInZoneValidator = () => {
	return object({
		set: object({
			point: geoJSONStruct("Point"),
			// Manager/Ghost only — validate a specific officer's zone
			userId: optional(objectIdValidation),
		}),
		get: object({
			inZone: optional(enums([0, 1])),
			policeStation: optional(enums([0, 1])),
		}),
	});
};