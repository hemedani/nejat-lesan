import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { geoJSONStruct } from "@model";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			english_name: optional(string()),
			area: optional(geoJSONStruct("Polygon")),
			center_location: optional(geoJSONStruct("Point")),
			// native_area: optional(geoJSONStruct("Polygon")),
			// non_native_area: optional(geoJSONStruct("Polygon")),
			// population: optional(number()),
			// area_number: optional(number()),
		}),
		get: selectStruct("city", 1),
	});
};
