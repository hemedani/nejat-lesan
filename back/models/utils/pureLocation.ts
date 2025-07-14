import { number, string } from "@deps";
import { geoJSONStruct } from "@model";
import { createUpdateAt } from "../../utils/createUpdateAt.ts";

export const pure_location = {
	name: string(),
	english_name: string(),
	population: number(),

	area: geoJSONStruct("MultiPolygon"),
	center_location: geoJSONStruct("Point"),

	...createUpdateAt,
};
