import type { GeoPoint } from "@/types/patrol";

/**
 * Great-circle distance between two GeoJSON points, in metres.
 *
 * Pure, and deliberately not `L.Map.distance()`. The report map's footer shows
 * this number as text, outside the map, so it has to be computable without a Leaflet
 * instance — and a pure function is testable on its own, which a map method is not.
 *
 * The haversine formula on a spherical earth. Good to ~0.5% against WGS-84 at the
 * scale of one crash site, which is far finer than the GPS accuracy we are comparing
 * it to.
 */
export function haversineMetres(a: GeoPoint, b: GeoPoint): number {
  const [lng1, lat1] = a.coordinates;
  const [lng2, lat2] = b.coordinates;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(h)));
}

const EARTH_RADIUS_METRES = 6_371_008.8;

/**
 * The gap between an incident and the officer's GPS fix, formatted for display.
 *
 * Returns `undefined` — not `"۰ متر"` — when either point is absent or the two
 * coincide. A distance of zero is a real reading and belongs on screen; "there is no
 * second point" is not a distance and must not be dressed as one.
 */
export function formatSeparation(
  location?: GeoPoint,
  gps?: GeoPoint,
): string | undefined {
  if (!location || !gps) return undefined;
  const metres = haversineMetres(location, gps);
  if (metres < 1) return "کمتر از ۱ متر";
  if (metres < 1000) return `${metres.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} متر`;
  return `${(metres / 1000).toLocaleString("fa-IR", { maximumFractionDigits: 2 })} کیلومتر`;
}

/** `35.123456, 51.234567` in Persian digits, or `undefined` when absent. */
export const formatPoint = (point?: GeoPoint): string | undefined => {
  if (!point) return undefined;
  const [lng, lat] = point.coordinates;
  if (typeof lat !== "number" || typeof lng !== "number") return undefined;
  return `${lat.toLocaleString("fa-IR", { maximumFractionDigits: 5 })}، ${lng.toLocaleString("fa-IR", { maximumFractionDigits: 5 })}`;
};
