import { type Document, ObjectId } from "@deps";
import { city_zone } from "../../mod.ts";

export type PointGeometry = {
	type: "Point";
	coordinates: [number, number];
};

/**
 * Resolve the single city zone that contains a point.
 *
 * `city_zone.area` is `2dsphere`-indexed, so this is one indexed lookup rather
 * than a scan. When the city is known the filter is scoped to that city's zones;
 * otherwise the global geo index still narrows the candidates.
 *
 * Overlapping zones resolve to the lowest `_id`, which makes "first match wins"
 * deterministic for both the write hooks and the backfill act.
 */
export const findCityZoneForPoint = async (
	location: PointGeometry | null | undefined,
	cityId?: ObjectId | string | null,
): Promise<ObjectId | undefined> => {
	if (
		!location || location.type !== "Point" ||
		!Array.isArray(location.coordinates) ||
		location.coordinates.length !== 2 ||
		!location.coordinates.every((coord) => typeof coord === "number")
	) {
		return undefined;
	}

	const filters: Document = {
		area: { $geoIntersects: { $geometry: location } },
	};
	if (cityId) {
		filters["city._id"] = typeof cityId === "string"
			? new ObjectId(cityId)
			: cityId;
	}

	const [zone] = await city_zone.find({
		filters,
		projection: { _id: 1 },
	}).sort({ _id: 1 }).limit(1).toArray();

	return zone?._id as ObjectId | undefined;
};
