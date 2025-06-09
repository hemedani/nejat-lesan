import { array, literal, number, object, Struct, tuple, union } from "@deps";

// نوع پایه: مختصات دو عددی (lng, lat)
const Coordinate = tuple([number(), number()]);

// Point
const PointStruct = object({
	type: literal("Point"),
	coordinates: Coordinate,
});

// MultiPoint
const MultiPointStruct = object({
	type: literal("MultiPoint"),
	coordinates: array(Coordinate),
});

// LineString
const LineStringStruct = object({
	type: literal("LineString"),
	coordinates: array(Coordinate),
});

// MultiLineString
const MultiLineStringStruct = object({
	type: literal("MultiLineString"),
	coordinates: array(array(Coordinate)),
});

// Polygon (هر حلقه باید بسته باشد، ولی در اینجا فقط ساختار بررسی می‌شود)
const PolygonStruct = object({
	type: literal("Polygon"),
	coordinates: array(array(Coordinate)),
});

// MultiPolygon
const MultiPolygonStruct = object({
	type: literal("MultiPolygon"),
	coordinates: array(array(array(Coordinate))),
});

// GeometryCollection
const GeometryCollectionStruct = object({
	type: literal("GeometryCollection"),
	geometries: array(
		union([
			PointStruct,
			MultiPointStruct,
			LineStringStruct,
			MultiLineStringStruct,
			PolygonStruct,
			MultiPolygonStruct,
		]),
	),
});

// ساختار نهایی GeoJSON Geometry
export const GeoJSONGeometryStruct: Struct<any> = union([
	PointStruct,
	MultiPointStruct,
	LineStringStruct,
	MultiLineStringStruct,
	PolygonStruct,
	MultiPolygonStruct,
	GeometryCollectionStruct,
]);

// Type for GeoJSON Geometry
export type GeoJSONGeometry =
	| { type: "Point"; coordinates: [number, number] }
	| { type: "MultiPoint"; coordinates: Array<[number, number]> }
	| { type: "LineString"; coordinates: Array<[number, number]> }
	| { type: "MultiLineString"; coordinates: Array<Array<[number, number]>> }
	| { type: "Polygon"; coordinates: Array<Array<[number, number]>> }
	| {
		type: "MultiPolygon";
		coordinates: Array<Array<Array<[number, number]>>>;
	}
	| { type: "GeometryCollection"; geometries: Array<GeoJSONGeometry> };

// تابع اعتبارسنجی داده
export function validateGeoJSON(input: any): { valid: boolean; error?: any } {
	try {
		// Use type casting to avoid the assertion error
		GeoJSONGeometryStruct.assert(input);
		return { valid: true };
	} catch (err) {
		return { valid: false, error: err };
	}
}
