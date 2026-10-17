/**
 * Turns the organization's road into GeoJSON for MapLibre.
 *
 * The WebView used to receive raw `[lng, lat]` arrays and project each vertex by
 * hand onto a 2D canvas. MapLibre wants a `GeoJSONSource`, so the overlay becomes
 * a small pure producer instead: lines become `LineString` features and the label
 * becomes one `Point` carrying the text. Coordinates stay `[lng, lat]` — the
 * order MapLibre's GeoJSON expects — so there is no swap to get wrong here.
 *
 * Pure module — no Expo imports — so the geometry is unit-testable without a
 * native renderer.
 */

import type { Feature, FeatureCollection, LineString, Point } from 'geojson';

import type { RoadLabel, RoadVertex } from './org-road';

/** The road's centrelines as a `LineString` collection, empty when nothing draws. */
export function roadLineGeoJSON(lines: readonly RoadVertex[][]): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  for (const line of lines) {
    if (line.length < 2) {
      continue;
    }
    features.push({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: line.map(vertex => [vertex[0], vertex[1]] as [number, number]),
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

/**
 * The two-line label text: the name, then `ends · length` when either is known.
 *
 * An empty «اهواز ←» with nothing after the arrow reads as a data error, so the
 * endpoints are only written when both are present — the same rule the canvas
 * label used.
 */
export function roadLabelText(label: RoadLabel): string {
  const ends =
    label.origin && label.destination ? `${label.origin} ← ${label.destination}` : '';
  const length =
    typeof label.totalLengthMeters === 'number' && label.totalLengthMeters > 0
      ? `${Math.round(label.totalLengthMeters / 1000).toLocaleString('fa-IR')} کیلومتر`
      : '';
  const detail = [ends, length].filter(Boolean).join(' · ');
  return detail ? `${label.name}\n${detail}` : label.name;
}

/**
 * A single point label for the road, or `null` when there is nothing to write.
 *
 * The point sits at the middle vertex of the longest line, the same
 * "somewhere on the road" placement the canvas used (which found the vertex
 * nearest the viewport centre at draw time; MapLibre places the point itself and
 * then keeps it out of the way of collisions).
 */
export function roadLabelFeature(
  lines: readonly RoadVertex[][],
  label: RoadLabel | null | undefined,
): Feature<Point> | null {
  if (!label || label.name.length === 0) {
    return null;
  }
  const point = middleOfLongestLine(lines);
  if (!point) {
    return null;
  }
  return {
    type: 'Feature',
    properties: { title: roadLabelText(label) },
    geometry: { type: 'Point', coordinates: [point[0], point[1]] },
  };
}

function middleOfLongestLine(lines: readonly RoadVertex[][]): RoadVertex | null {
  let best: readonly RoadVertex[] | null = null;
  for (const line of lines) {
    if (line.length >= 2 && (!best || line.length > best.length)) {
      best = line;
    }
  }
  return best ? best[Math.floor(best.length / 2)] : null;
}
