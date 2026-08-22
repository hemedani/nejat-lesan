import { enums, number, object, optional } from "@deps";
import { geoJSONStruct } from "@model";

export const getRoadsGeometryValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			// Restrict to roads intersecting this polygon (offline cache area)
			polygon: optional(geoJSONStruct("Polygon")),
		}),
		get: object({
			roads: optional(enums([0, 1])),
			count: optional(enums([0, 1])),
		}),
	});
};