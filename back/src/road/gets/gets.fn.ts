import type { ActFn, ObjectId } from "@deps";
import { road } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, name, provinceIds },
		get,
	} = body.details;

	const pipeline = [];
	const matchConditions: Record<string, any> = {};

	if (name) {
		matchConditions.name = { $regex: new RegExp(name, "i") };
	}

	if (provinceIds && provinceIds.length > 0) {
		matchConditions["province._id"] = { $in: provinceIds };
	}

	if (Object.keys(matchConditions).length > 0) {
		pipeline.push({ $match: matchConditions });
	}

	pipeline.push({ $sort: { _id: -1 } });
	pipeline.push({ $skip: (page - 1) * limit });
	pipeline.push({ $limit: limit });

	return await road
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
