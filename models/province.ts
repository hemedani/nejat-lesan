import { coreApp } from "../mod.ts";
import {
	array,
	literal,
	number,
	object,
	type RelationDataType,
	string,
	tuple,
} from "@deps";
import { createUpdateAt } from "@lib";

const Coordinate = tuple([number(), number()]);

export const geoJSONStruct = (
	type:
		| "Line"
		| "Polygon"
		| "LineString"
		| "Point"
		| "MultiPoint"
		| "MultiLineString"
		| "MultiPolygon",
) => object({
	type: literal(type),
	coordinates: type === "Point"
		? Coordinate
		: type === "MultiLineString" || type === "Polygon"
		? array(array(Coordinate))
		: type === "MultiPolygon"
		? array(array(array(Coordinate)))
		: array(Coordinate),
});

export const pure_location = {
	name: string(),
	english_name: string(),

	area: geoJSONStruct("Polygon"),
	center_location: geoJSONStruct("Point"),

	...createUpdateAt,
};

export const province_pure = { ...pure_location };

export const province_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
};

export const provinces = () =>
	coreApp.odm.newModel("province", province_pure, province_relations);
