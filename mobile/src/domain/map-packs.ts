/**
 * Pure offline-map pack definitions and slippy-map (XYZ) tile math.
 * No React Native / Expo imports so the whole surface is unit-testable.
 */

export type GeoBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/** Whole-of-Iran bounding box (including coastal waters margin). */
export const IRAN_BOUNDS: GeoBounds = {
  minLat: 24.5,
  maxLat: 40.0,
  minLng: 43.5,
  maxLng: 64.0,
};

export type MapTierId = 'base' | 'deep';

export type MapTier = {
  id: MapTierId;
  zoomMin: number;
  zoomMax: number;
};

export const MAP_TIERS: Record<MapTierId, MapTier> = {
  base: { id: 'base', zoomMin: 4, zoomMax: 10 },
  deep: { id: 'deep', zoomMin: 4, zoomMax: 12 },
};

/** Rough average OSM raster tile size in bytes, used for pre-download estimates. */
const AVG_TILE_BYTES = 18_000;

export function lngToTileX(lng: number, zoom: number): number {
  const clamped = Math.max(-180, Math.min(180, lng));
  return ((clamped + 180) / 360) * Math.pow(2, zoom);
}

export function latToTileY(lat: number, zoom: number): number {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const rad = (clamped * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

export function tileCountForBounds(bounds: GeoBounds, zoom: number): number {
  const n = Math.pow(2, zoom);
  const x0 = Math.min(n - 1, Math.max(0, Math.floor(lngToTileX(bounds.minLng, zoom))));
  const x1 = Math.min(n - 1, Math.max(0, Math.floor(lngToTileX(bounds.maxLng, zoom))));
  const yTop = Math.min(n - 1, Math.max(0, Math.floor(latToTileY(bounds.maxLat, zoom))));
  const yBottom = Math.min(n - 1, Math.max(0, Math.floor(latToTileY(bounds.minLat, zoom))));
  return (x1 - x0 + 1) * (yBottom - yTop + 1);
}

export type PackEstimate = {
  tilesTotal: number;
  estimatedBytes: number;
  perZoom: { zoom: number; tiles: number }[];
};

export function estimatePack(tier: MapTier, bounds: GeoBounds = IRAN_BOUNDS): PackEstimate {
  const perZoom: { zoom: number; tiles: number }[] = [];
  let tilesTotal = 0;
  for (let zoom = tier.zoomMin; zoom <= tier.zoomMax; zoom += 1) {
    const tiles = tileCountForBounds(bounds, zoom);
    perZoom.push({ tiles, zoom });
    tilesTotal += tiles;
  }
  return { estimatedBytes: tilesTotal * AVG_TILE_BYTES, perZoom, tilesTotal };
}

export type TileCoord = { z: number; x: number; y: number };

/**
 * Iterates every tile of a pack, zoom-ascending so the country outline
 * appears early during download. `visit` returning false stops iteration.
 */
export function iterTiles(
  tier: MapTier,
  visit: (tile: TileCoord) => false | void,
  bounds: GeoBounds = IRAN_BOUNDS,
): void {
  for (let z = tier.zoomMin; z <= tier.zoomMax; z += 1) {
    const n = Math.pow(2, z);
    const x0 = Math.min(n - 1, Math.max(0, Math.floor(lngToTileX(bounds.minLng, z))));
    const x1 = Math.min(n - 1, Math.max(0, Math.floor(lngToTileX(bounds.maxLng, z))));
    const yTop = Math.min(n - 1, Math.max(0, Math.floor(latToTileY(bounds.maxLat, z))));
    const yBottom = Math.min(n - 1, Math.max(0, Math.floor(latToTileY(bounds.minLat, z))));
    for (let y = yTop; y <= yBottom; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        if (visit({ x, y, z }) === false) {
          return;
        }
      }
    }
  }
}

/** Persian-friendly byte formatter shared by all map UI surfaces. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '۰';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('fa-IR')} کیلوبایت`;
  }
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return `${(Math.round(mb * 10) / 10).toLocaleString('fa-IR')} مگابایت`;
  }
  return `${(Math.round((mb / 1024) * 10) / 10).toLocaleString('fa-IR')} گیگابایت`;
}
