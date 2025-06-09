import type { ActFn } from "@deps";
import { air_status } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, name, names },
		get,
	} = body.details;

	const pipeline = [];

	name &&
		pipeline.push({
			$match: {
				name: { $regex: new RegExp(name, "i") },
			},
		});

	names && names.length > 0 &&
		pipeline.push({ $match: { name: { $in: names } } });

	pipeline.push({ $sort: { _id: -1 } });
	pipeline.push({ $skip: (page - 1) * limit });
	pipeline.push({ $limit: limit });

	return await air_status
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
