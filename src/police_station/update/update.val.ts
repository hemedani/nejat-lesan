import {
	boolean,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";
import { geoJSONStruct } from "@model";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			area: optional(geoJSONStruct("Polygon")),

			location: optional(geoJSONStruct("Polygon")),
			code: optional(number()),
			is_active: optional(boolean()),
			military_rank: optional(number()),
		}),
		get: selectStruct("police_station", 1),
	});
};
