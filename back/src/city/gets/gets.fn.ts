import type { ActFn } from "@deps";
import { city } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, name, provinceIds, _ids },
		get,
	} = body.details;

	const pipeline = [];

	const matchConditions: Record<string, any> = {};

	// Handle name filter
	if (name) {
		matchConditions.name = { $regex: new RegExp(name, "i") };
	}

	// Handle _ids filter (for city-based access)
	if (_ids && _ids.length > 0) {
		matchConditions._id = { $in: _ids };
	}

	// Handle provinceIds filter (for province-based access)
	// Note: _ids and provinceIds are mutually exclusive
	if (provinceIds && provinceIds.length > 0) {
		matchConditions["province._id"] = { $in: provinceIds };
	}

	if (Object.keys(matchConditions).length > 0) {
		pipeline.push({ $match: matchConditions });
	}

	pipeline.push({ $sort: { _id: -1 } });
	pipeline.push({ $skip: (page - 1) * limit });
	pipeline.push({ $limit: limit });

	return await city
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
