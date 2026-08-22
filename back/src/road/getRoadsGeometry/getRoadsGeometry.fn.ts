import type { ActFn } from "@deps";
import { road } from "../../../mod.ts";

export const getRoadsGeometryFn: ActFn = async (body) => {
	const {
		set: { polygon, page, limit },
	} = body.details;

	const currentPage = page || 1;
	const perPage = limit || 100;

	const filters: Record<string, unknown> = {};
	if (polygon) {
		filters.area = { $geoIntersects: { $geometry: polygon } };
	}

	const roads = await road
		.find({
			filters,
			projection: {
				_id: 1,
				name: 1,
				area: 1,
				origin: 1,
				destination: 1,
				total_length_meters: 1,
				lanes: 1,
				updatedAt: 1,
			},
		})
		.skip(perPage * (currentPage - 1))
		.limit(perPage)
		.toArray();

	return {
		roads,
		count: roads.length,
		page: currentPage,
	};
};