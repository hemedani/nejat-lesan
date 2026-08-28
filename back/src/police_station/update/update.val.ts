import {
	boolean,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { geoJSONStruct } from "@model";
import { selectStruct } from "../../../mod.ts";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			code: optional(number()),
			military_rank: optional(number()),
			is_active: optional(boolean()),
			location: optional(geoJSONStruct("Polygon")),
			area: optional(geoJSONStruct("MultiPolygon")),
			commanderId: optional(objectIdValidation),
		}),
		get: selectStruct("police_station", 1),
	});
};
