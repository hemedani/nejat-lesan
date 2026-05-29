import { type ActFn, ObjectId } from "@deps";
import { city_zone } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, name, cities, cityNames, provinceIds },
		get,
	} = body.details;

	const pipeline = [];

	const matchConditions: Record<string, any> = {};

	if (name) {
		matchConditions.name = { $regex: new RegExp(name, "i") };
	}

	if (cities && cities.length > 0) {
		matchConditions["city._id"] = {
			$in: cities.map((id: string) => new ObjectId(id)),
		};
	}

	if (cityNames && cityNames.length > 0) {
		matchConditions["city.name"] = { $in: cityNames };
	}

	if (provinceIds && provinceIds.length > 0) {
		matchConditions["city.province._id"] = {
			$in: provinceIds.map((id: string) => new ObjectId(id)),
		};
	}

	if (Object.keys(matchConditions).length > 0) {
		pipeline.push({ $match: matchConditions });
	}

	pipeline.push({ $sort: { _id: -1 } });
	pipeline.push({ $skip: (page - 1) * limit });
	pipeline.push({ $limit: limit });

	const getsCisd = await city_zone
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();

	return getsCisd;
};
