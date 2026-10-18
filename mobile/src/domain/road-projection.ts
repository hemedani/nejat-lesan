/**
 * Linear referencing over a road's centreline, on the device.
 *
 * This mirrors `back/utils/geo.ts` (`projectPointToMultiLine`) deliberately and
 * exactly: the kilometre/meter a report carries must be the one the backend would
 * have computed for the same point, or a snap taken offline and a snap taken
 * online would disagree about where on the road an incident happened. The method
 * is an equirectangular planar approximation local to the query latitude — the
 * same one the backend uses.
 *
 * Pure module, no Expo imports, so the geometry is unit-testable without the map.
 */

import type { RoadVertex } from './org-road';

export const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

/** Approximate metres per degree at a given latitude (equirectangular). */
function meterPerDegree(lat: number): { x: number; y: number } {
  return {
    x: Math.cos(toRad(lat)) * 111320,
    y: 110574,
  };
}

function polylineLengthMeters(line: readonly RoadVertex[]): number {
  if (line.length < 2) {
    return 0;
  }
  const scale = meterPerDegree(line[0][1]);
  let total = 0;
  for (let index = 0; index < line.length - 1; index += 1) {
    const [x1, y1] = line[index];
    const [x2, y2] = line[index + 1];
    total += Math.hypot((x2 - x1) * scale.x, (y2 - y1) * scale.y);
  }
  return total;
}

export type PolylineProjection = {
  /** Distance along the polyline from its start. */
  alongMeters: number;
  /** Perpendicular distance from the point to the line. */
  perpMeters: number;
  /** The projected point, `[longitude, latitude]`. */
  nearest: RoadVertex;
};

export function projectPointToPolyline(
  point: RoadVertex,
  line: readonly RoadVertex[],
): PolylineProjection {
  const [pointLng, pointLat] = point;
  const scale = meterPerDegree(pointLat);
  const px = pointLng * scale.x;
  const py = pointLat * scale.y;

  let bestAlong = 0;
  let bestPerp = Infinity;
  let bestNearest: RoadVertex = [pointLng, pointLat];
  let cumulative = 0;

  for (let index = 0; index < line.length - 1; index += 1) {
    const [aLng, aLat] = line[index];
    const [bLng, bLat] = line[index + 1];
    const ax = aLng * scale.x;
    const ay = aLat * scale.y;
    const bx = bLng * scale.x;
    const by = bLat * scale.y;
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    let t = lengthSquared ? ((px - ax) * dx + (py - ay) * dy) / lengthSquared : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const perp = Math.hypot(px - cx, py - cy);
    if (perp < bestPerp) {
      bestPerp = perp;
      bestAlong = cumulative + t * Math.hypot(dx, dy);
      bestNearest = [cx / scale.x, cy / scale.y];
    }
    cumulative += Math.hypot(dx, dy);
  }

  return {
    alongMeters: bestAlong,
    perpMeters: bestPerp,
    nearest: bestNearest,
  };
}

export type MultiLineProjection = {
  alongMeters: number;
  perpMeters: number;
  nearest: RoadVertex;
  totalLengthMeters: number;
};

export function projectPointToMultiLine(
  multi: readonly RoadVertex[][],
  point: RoadVertex,
): MultiLineProjection {
  let lineOffset = 0;
  let bestAlong = 0;
  let bestPerp = Infinity;
  let bestNearest: RoadVertex = point;
  let total = 0;

  for (const line of multi) {
    const length = polylineLengthMeters(line);
    total += length;
    const result = projectPointToPolyline(point, line);
    if (result.perpMeters < bestPerp) {
      bestPerp = result.perpMeters;
      bestAlong = lineOffset + result.alongMeters;
      bestNearest = result.nearest;
    }
    lineOffset += length;
  }

  return {
    alongMeters: bestAlong,
    perpMeters: bestPerp,
    nearest: bestNearest,
    totalLengthMeters: total,
  };
}
