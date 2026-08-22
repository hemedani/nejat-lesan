import { enums, object, optional } from "@deps";
import { geoJSONStruct } from "@model";

export const snapPointToRoadValidator = () => {
	return object({
		set: object({
			point: geoJSONStruct("Point"),
		}),
		get: object({
			road: optional(enums([0, 1])),
			distanceToRoadMeters: optional(enums([0, 1])),
			fromOriginMeters: optional(enums([0, 1])),
			totalLengthMeters: optional(enums([0, 1])),
			kilometer: optional(enums([0, 1])),
			meter: optional(enums([0, 1])),
			direction: optional(enums([0, 1])),
			lanes: optional(enums([0, 1])),
		}),
	});
};