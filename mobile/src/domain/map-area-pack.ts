/**
 * Bounding-box geometry for the organisation area pack.
 *
 * The backend has no officer→zone relation and `primaryOrganization` carries
 * only `{_id, code, name, enName, location, location_zoom}`. Its
 * `location_zoom` is documented as *corridor* scale (a 116 km motorway org
 * ships `13`), so it cannot size a box for both motorway and municipal orgs.
 * The box therefore comes from the org point plus a radius the officer picks.
 *
 * Pure module — no Expo imports — so the geometry is unit-testable.
 */

import {
  tileCountForBounds,
  type GeoBounds,
  type MapTier,
  type PackEstimate,
} from './map-packs';

const METERS_PER_DEGREE_LATITUDE = 111_320;
export { METERS_PER_DEGREE_LATITUDE };

/** Mercator's valid latitude cutoff; a tile above it simply does not exist. */
export const MAX_MERCATOR_LATITUDE = 85.05112878;

/** Radius presets the officer picks from, smallest first.
 *
 *  A radius is a half-width, so the box is twice this across. At z13..z14 over
 *  Ahvaz that is ۵ km → 48 tiles (~2.5 MB), ۱۰ km → 150 tiles (~7.8 MB),
 *  ۲۵ km → 891 tiles (~46 MB). The ladder stops at ۲۵ km because a wider box
 *  buys nothing: the vector server caps detail at z14, so beyond that the
 *  officer is only paying for a bigger low-detail overview.
 */
export const AREA_RADII_KM: readonly { km: number; label: string }[] = [
  { km: 5, label: '۵ کیلومتر' },
  { km: 10, label: '۱۰ کیلومتر' },
  { km: 25, label: '۲۵ کیلومتر' },
];

/**
 * The zoom range the area pack fills.
 *
 * 13..14, not 13..17: the tile server renders vector data to maxzoom 14 and
 * overzooms from there, so a pack that asked for z15–z17 would spend its
 * budget re-fetching tiles the server returns 404 for. 14 is the deepest real
 * level; MapLibre's overzoom gives the incident-scale detail above it.
 */
export const AREA_ZOOM_MIN = 13;
export const AREA_ZOOM_MAX = 14;

/** The zoom range the area pack fills: above the national overview, at incident scale. */
export const AREA_TIER: MapTier = {
  id: 'deep',
  zoomMin: AREA_ZOOM_MIN,
  zoomMax: AREA_ZOOM_MAX,
};

export type CenterPoint = { latitude: number; longitude: number };

/** Metres covered by one degree of latitude at `latitude`. */
export function metersToLatitudeDegrees(meters: number, latitude: number): number {
  const clamped = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
  return meters / (METERS_PER_DEGREE_LATITUDE * Math.cos((clamped * Math.PI) / 180));
}

/**
 * A square box of `radiusKm` around `center`, or `null` when the inputs cannot
 * describe one.
 *
 * Null rather than a silent default: an org with no `location` (Ghost, Manager,
 * a member of several orgs) must keep only the national pack and say so, not
 * quietly download a box centred on Tehran.
 */
export function boundsForRadius(center: CenterPoint | null | undefined, radiusKm: number): GeoBounds | null {
  if (!center) {
    return null;
  }
  const { latitude, longitude } = center;
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    return null;
  }

  const meters = radiusKm * 1000;
  const latDelta = metersToLatitudeDegrees(meters, latitude);
  // Longitude degrees shrink toward the poles; at 84°N a naive division would
  // produce a box nine times wider than intended (and past the mercator limit).
  const cosLat = Math.cos((Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude)) * Math.PI) / 180);
  const lngDelta = Math.abs(cosLat) < 1e-6 ? 180 : meters / (METERS_PER_DEGREE_LATITUDE * cosLat);

  return {
    maxLat: Math.min(MAX_MERCATOR_LATITUDE, latitude + latDelta),
    maxLng: Math.min(180, longitude + lngDelta),
    minLat: Math.max(-MAX_MERCATOR_LATITUDE, latitude - latDelta),
    minLng: Math.max(-180, longitude - lngDelta),
  };
}

/** Tile/byte estimate for an area box, for the download screen's sizing copy. */
export function estimateAreaPack(
  center: CenterPoint | null | undefined,
  radiusKm: number,
  zoomMin: number = AREA_TIER.zoomMin,
  zoomMax: number = AREA_TIER.zoomMax,
): PackEstimate {
  const bounds = boundsForRadius(center, radiusKm);
  if (!bounds) {
    return { estimatedBytes: 0, perZoom: [], tilesTotal: 0 };
  }
  const perZoom: { zoom: number; tiles: number }[] = [];
  let tilesTotal = 0;
  for (let zoom = zoomMin; zoom <= zoomMax; zoom += 1) {
    const tiles = tileCountForBounds(bounds, zoom);
    perZoom.push({ tiles, zoom });
    tilesTotal += tiles;
  }
  return { estimatedBytes: tilesTotal * AREA_TILE_BYTES, perZoom, tilesTotal };
}

/**
 * Per-tile decoded size for the area estimate.
 *
 * Measured against the vector server's own reference ۱۰ km pack (۹.۷۵ MB
 * decoded over ۱۷۹ tiles), i.e. ~54 KB/tile at z13–z14. Detail tiles carry
 * more than the flat country average, so this is deliberately the higher
 * figure rather than one that understates the download.
 */
const AREA_TILE_BYTES = 54_500;