import { object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { geoJSONStruct } from "@model";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			english_name: optional(string()),
			area: geoJSONStruct("Polygon"),
			center_location: geoJSONStruct("Point"),
		}),
		get: selectStruct("province", 1),
	});
};
