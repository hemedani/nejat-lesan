import type { ActFn } from "@deps";
import { road } from "../../../mod.ts";
import { throwError } from "@lib";
import { projectPointToMultiLine } from "../../../utils/geo.ts";

export const snapPointToRoadFn: ActFn = async (body) => {
	const {
		set: { point },
	} = body.details;

	const [lng, lat] = point.coordinates as [number, number];

	// Nearest road via the 2dsphere index on `area`.
	const [nearest] = await road
		.aggregation({
			pipeline: [
				{
					$geoNear: {
						near: point,
						distanceField: "nearDistance",
						spherical: true,
						maxDistance: 20000,
					},
				},
				{ $limit: 1 },
			],
			projection: {
				_id: 1,
				name: 1,
				area: 1,
				origin: 1,
				destination: 1,
				total_length_meters: 1,
				lanes: 1,
			},
		})
		.toArray();

	if (!nearest) throwError("نزدیک‌ترین راه در شعاع پوشش یافت نشد");

	const proj = projectPointToMultiLine(
		(nearest.area as { coordinates: number[][][] }).coordinates,
		[lng, lat],
	);

	return {
		road: { _id: nearest._id, name: nearest.name },
		distanceToRoadMeters: Math.round(proj.perpMeters),
		fromOriginMeters: Math.round(proj.alongMeters),
		totalLengthMeters: nearest.total_length_meters ??
			Math.round(proj.totalLengthMeters),
		kilometer: Math.floor(proj.alongMeters / 1000),
		meter: Math.round(proj.alongMeters % 1000),
		origin: nearest.origin,
		destination: nearest.destination,
		direction: nearest.origin && nearest.destination
			? `${nearest.origin} - ${nearest.destination}`
			: null,
		lanes: nearest.lanes ?? [],
		nearestPoint: {
			type: "Point",
			coordinates: proj.nearest,
		},
	};
};