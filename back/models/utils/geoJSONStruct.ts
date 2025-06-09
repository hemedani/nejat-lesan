import { array, literal, number, object, tuple } from "@deps";

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
