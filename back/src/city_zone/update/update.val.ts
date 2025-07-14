import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { geoJSONStruct } from "@model";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			population: optional(number()),
			area: optional(geoJSONStruct("MultiPolygon")),
		}),
		get: selectStruct("city_zone", 1),
	});
};
