/**
 * Spatial helpers for linear referencing (Step 9).
 * Uses an equirectangular planar approximation local to the query latitude;
 * accurate enough for kilometer/meter reporting along road geometry.
 */

const EARTH_RADIUS_M = 6371000;

export const toRad = (d: number): number => (d * Math.PI) / 180;

export const haversineMeters = (
	a: [number, number],
	b: [number, number],
): number => {
	const [lng1, lat1] = a;
	const [lng2, lat2] = b;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const s = Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s));
};

// Approximate meters per degree at a given latitude (equirectangular).
const meterPerDeg = (lat: number) => ({
	x: Math.cos(toRad(lat)) * 111320, // meters per degree longitude
	y: 110574, // meters per degree latitude
});

const polylineLengthMeters = (line: [number, number][]): number => {
	if (line.length < 2) return 0;
	const scale = meterPerDeg(line[0][1]);
	let total = 0;
	for (let i = 0; i < line.length - 1; i++) {
		const [x1, y1] = line[i];
		const [x2, y2] = line[i + 1];
		total += Math.hypot(
			(x2 - x1) * scale.x,
			(y2 - y1) * scale.y,
		);
	}
	return total;
};

export interface PolylineProjection {
	alongMeters: number; // distance along the polyline from its start
	perpMeters: number; // perpendicular distance from the point to the line
	nearest: [number, number]; // projected point [lng, lat]
}

export const projectPointToPolyline = (
	point: [number, number],
	line: [number, number][],
): PolylineProjection => {
	const [plng, plat] = point;
	const scale = meterPerDeg(plat);
	const px = plng * scale.x;
	const py = plat * scale.y;

	let bestAlong = 0;
	let bestPerp = Infinity;
	let bestNearest: [number, number] = [plng, plat];
	let cum = 0;

	for (let i = 0; i < line.length - 1; i++) {
		const [alng, alat] = line[i];
		const [blng, blat] = line[i + 1];
		const ax = alng * scale.x;
		const ay = alat * scale.y;
		const bx = blng * scale.x;
		const by = blat * scale.y;
		const dx = bx - ax;
		const dy = by - ay;
		const len2 = dx * dx + dy * dy;
		let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
		t = Math.max(0, Math.min(1, t));
		const cx = ax + t * dx;
		const cy = ay + t * dy;
		const perp = Math.hypot(px - cx, py - cy);
		if (perp < bestPerp) {
			bestPerp = perp;
			bestAlong = cum + t * Math.hypot(dx, dy);
			bestNearest = [cx / scale.x, cy / scale.y];
		}
		cum += Math.hypot(dx, dy);
	}

	return {
		alongMeters: bestAlong,
		perpMeters: bestPerp,
		nearest: bestNearest,
	};
};

export interface MultiLineProjection {
	alongMeters: number;
	perpMeters: number;
	nearest: [number, number];
	totalLengthMeters: number;
}

export const projectPointToMultiLine = (
	multi: number[][][],
	point: [number, number],
): MultiLineProjection => {
	let lineOffset = 0;
	let bestAlong = 0;
	let bestPerp = Infinity;
	let bestNearest: [number, number] = point;
	let total = 0;

	for (const rawLine of multi) {
		const line = rawLine as [number, number][];
		const len = polylineLengthMeters(line);
		total += len;
		const res = projectPointToPolyline(point, line);
		if (res.perpMeters < bestPerp) {
			bestPerp = res.perpMeters;
			bestAlong = lineOffset + res.alongMeters;
			bestNearest = res.nearest;
		}
		lineOffset += len;
	}

	return {
		alongMeters: bestAlong,
		perpMeters: bestPerp,
		nearest: bestNearest,
		totalLengthMeters: total,
	};
};