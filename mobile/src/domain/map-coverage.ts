/**
 * The one place that decides which slippy-map tile level the WebView may ask
 * for.
 *
 * Why this module exists: the renderer used to request `Math.floor(zoom)` with
 * no knowledge of what was on disk, while the downloader only ever wrote
 * z4..z12. The picker opens at z17, so every `file://…/mapcache/17/…` load
 * failed, the per-tile network fallback failed too (airplane mode), and the
 * officer was left staring at the page's bare background. Coverage is what
 * reconciles the two, so it is computed here — pure, and unit-tested — rather
 * than being smeared across the bridge and the generated HTML.
 */

/** Zoom range the offline cache actually covers. `null` means "unknown". */
export type MapCoverage = {
  zoomMin: number;
  zoomMax: number;
};

/**
 * The area pack fills the gap between the national overview and incident
 * picking: the national pack stops at z12 (~78 m/px), which is a city overview,
 * while pinning an accident needs z17 (~1 m/px).
 */
export const AREA_ZOOM_MIN = 13;
export const AREA_ZOOM_MAX = 17;

/**
 * Fallback used before any pack has been read. It is deliberately permissive
 * (the renderer's own MIN/MAX) so an unknown cache state renders the requested
 * level and lets the network supply it, instead of clamping to a guess and
 * showing a blurry map while online.
 */
export const DEFAULT_COVERAGE: MapCoverage = { zoomMin: 3, zoomMax: 19 };

function isUsableZoom(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Builds a coverage, or `null` when the inputs cannot describe a real range. */
export function coverageFromZooms(zoomMin: number, zoomMax: number): MapCoverage | null {
  if (!isUsableZoom(zoomMin) || !isUsableZoom(zoomMax)) {
    return null;
  }
  const lo = Math.round(Math.min(zoomMin, zoomMax));
  const hi = Math.round(Math.max(zoomMin, zoomMax));
  return { zoomMin: lo, zoomMax: hi };
}

/** The union of every downloaded pack, or `null` when none is usable. */
export function combineCoverage(packages: readonly (MapCoverage | null)[]): MapCoverage | null {
  let zoomMin = Number.POSITIVE_INFINITY;
  let zoomMax = Number.NEGATIVE_INFINITY;
  for (const pack of packages) {
    if (!pack) {
      continue;
    }
    zoomMin = Math.min(zoomMin, pack.zoomMin);
    zoomMax = Math.max(zoomMax, pack.zoomMax);
  }
  return Number.isFinite(zoomMin) && Number.isFinite(zoomMax) ? { zoomMin, zoomMax } : null;
}

/**
 * The tile level for a requested map zoom.
 *
 * Coverage is only a constraint when the network cannot be relied on. Applying
 * it unconditionally is a different bug: online, the pack's z4..z10 gets scaled
 * up to the z17 the officer is actually looking at, and the map is a blur even
 * though the tiles are one request away.
 *
 * A `null` coverage means "nothing known yet" and is passed through untouched —
 * over-restricting here is how a working map gets made blank.
 */
export function tileZoomFor(
  requestedZoom: number,
  coverage: MapCoverage | null,
  options: { offline?: boolean } = {},
): number {
  if (!isUsableZoom(requestedZoom)) {
    return DEFAULT_COVERAGE.zoomMin;
  }
  const target = Math.floor(requestedZoom);
  if (!options.offline || !coverage) {
    return target;
  }
  if (!isUsableZoom(coverage.zoomMin) || !isUsableZoom(coverage.zoomMax)) {
    return target;
  }
  const lo = Math.min(coverage.zoomMin, coverage.zoomMax);
  const hi = Math.max(coverage.zoomMin, coverage.zoomMax);
  return Math.min(hi, Math.max(lo, target));
}

/**
 * Whether the tile level an officer is looking at is *fully backed by disk*.
 *
 * Deliberately about the requested zoom, never about the clamped one: the clamp
 * guarantees something is drawn, so testing the clamped value would report
 * "offline ready" at any zoom — telling the officer a blurry z10 render is a
 * usable z17 map.
 */
export function isOfflineReadyAt(coverage: MapCoverage | null, zoom: number): boolean {
  if (!coverage || !isUsableZoom(coverage.zoomMin) || !isUsableZoom(coverage.zoomMax)) {
    return false;
  }
  if (!isUsableZoom(zoom)) {
    return false;
  }
  const lo = Math.min(coverage.zoomMin, coverage.zoomMax);
  const hi = Math.max(coverage.zoomMin, coverage.zoomMax);
  const target = Math.floor(zoom);
  return target >= lo && target <= hi;
}

/** Whether a zoom level is fully available offline. */
export function isCoveredBy(coverage: MapCoverage | null, zoom: number): boolean {
  if (!coverage || !isUsableZoom(coverage.zoomMin) || !isUsableZoom(coverage.zoomMax)) {
    return false;
  }
  const lo = Math.min(coverage.zoomMin, coverage.zoomMax);
  const hi = Math.max(coverage.zoomMin, coverage.zoomMax);
  return Math.floor(zoom) >= lo && Math.floor(zoom) <= hi;
}

const METERS_PER_EQUATOR_DEGREE = 156543.03392;

/** Ground resolution in metres per pixel at the equator for a zoom level. */
export function metersPerPixel(zoom: number, latitude: number): number {
  const safeZoom = isUsableZoom(zoom) ? zoom : DEFAULT_COVERAGE.zoomMin;
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const scale = Math.cos((clampedLat * Math.PI) / 180);
  return (METERS_PER_EQUATOR_DEGREE * scale) / Math.pow(2, safeZoom);
}

/** Nice round distances for the scale bar, coarsest first. */
const SCALE_STEPS_METERS = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000, 200_000,
];

/**
 * Ground distance the scale bar represents, snapped to a round number so it
 * does not flicker between odd values while the officer pans.
 *
 * The step is chosen for a bar roughly `SCALE_BAR_TARGET_PX` wide rather than
 * one pixel wide: snapping to a single pixel at z10 yields "۲۰۰ متر", which
 * renders as an unreadable hairline instead of a usable reference.
 */
export const SCALE_BAR_TARGET_PX = 80;

export function scaleBarMeters(zoom: number, targetPx: number = SCALE_BAR_TARGET_PX): number {
  const perPixel = metersPerPixel(zoom, 32);
  const wanted = perPixel * Math.max(1, targetPx);
  return SCALE_STEPS_METERS.find(step => step >= wanted) ?? SCALE_STEPS_METERS.at(-1)!;
}

/** Persian scale-bar label for a zoom. */
export function scaleLabelForZoom(zoom: number): string {
  const metres = scaleBarMeters(zoom);
  if (metres >= 1000) {
    const km = metres / 1000;
    const value = Number.isInteger(km) ? km : Math.round(km * 10) / 10;
    return `${value.toLocaleString('fa-IR')} کیلومتر`;
  }
  return `${metres.toLocaleString('fa-IR')} متر`;
}