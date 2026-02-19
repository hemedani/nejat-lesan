import type { ActFn } from "@deps";
import { province } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, name, _ids },
		get,
	} = body.details;

	const pipeline = [];

	const matchConditions: Record<string, any> = {};

	// Handle name filter
	if (name) {
		matchConditions.name = { $regex: new RegExp(name, "i") };
	}

	// Handle _ids filter
	if (_ids && _ids.length > 0) {
		matchConditions._id = { $in: _ids };
	}

	if (Object.keys(matchConditions).length > 0) {
		pipeline.push({ $match: matchConditions });
	}

	pipeline.push({ $sort: { _id: -1 } });
	pipeline.push({ $skip: (page - 1) * limit });
	pipeline.push({ $limit: limit });

	return await province
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
