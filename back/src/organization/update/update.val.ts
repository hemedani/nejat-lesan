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
			code: optional(string()),
			name: optional(string()),
			enName: optional(string()),
			description: optional(string()),
			is_active: optional(boolean()),
			location: optional(geoJSONStruct("Point")),
			location_zoom: optional(number()),
			headId: optional(objectIdValidation),
			logoId: optional(objectIdValidation),
		}),
		get: selectStruct("organization", 1),
	});
};
