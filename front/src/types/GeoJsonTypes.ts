// Shared GeoJSON type definitions

type GeoJsonGeometryType =
  | "Point"
  | "MultiPoint"
  | "LineString"
  | "MultiLineString"
  | "Polygon"
  | "MultiPolygon"
  | "GeometryCollection";

export interface GeoJsonFeature {
  type: "Feature";
  properties: {
    name: string;
    [key: string]: unknown;
  };
  geometry: {
    type: GeoJsonGeometryType;
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJsonData {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}
