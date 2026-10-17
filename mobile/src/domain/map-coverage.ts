/**
 * The zoom range the offline packs actually cover.
 *
 * This module used to be much larger: it clamped the WebView's slippy-map tile
 * requests to what was on disk (`tileZoomFor`), decided whether the current
 * zoom was fully backed by disk (`isOfflineReadyAt`), and fed a badge that
 * narrated all of it. Native MapLibre renders from its own offline packs and
 * ambient cache without being told a tile level, so the clamp — and the badge
 * built on it — were removed with the WebView. What is left is the one pure
 * question the pack list still has to answer: which zoom range is on disk.
 */

/** Zoom range the offline packs cover. `null` means "nothing usable". */
export type MapCoverage = {
  zoomMin: number;
  zoomMax: number;
};

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
