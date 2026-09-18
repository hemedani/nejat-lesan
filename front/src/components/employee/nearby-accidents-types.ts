import type { GeoPoint } from "@/types/patrol";

/** Axis-aligned geographic box accepted by `accident.nearbyAccidents`. */
export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Imperative handle the toolbar uses to move the leaflet map. */
export interface MapApi {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

/**
 * One accident as returned by `accident.nearbyAccidents`.
 *
 * Deliberately slim — the backend projects only map-safe fields, so there is no
 * driver, insurance or vehicle data here.
 */
export interface NearbyAccidentPoint {
  _id: string;
  report_id?: string | null;
  seri?: string | null;
  location?: GeoPoint | null;
  date_of_accident?: string | null;
  review_status?: string | null;
  incident_type?: string;
  type_name?: string | null;
  incident_severity_name?: string | null;
}
