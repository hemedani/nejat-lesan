import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { geoJSONStruct } from "@model";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			english_name: optional(string()),
			population: optional(number()),
			area: optional(geoJSONStruct("MultiPolygon")),
			center_location: optional(geoJSONStruct("Point")),
		}),
		get: selectStruct("province", 1),
	});
};
