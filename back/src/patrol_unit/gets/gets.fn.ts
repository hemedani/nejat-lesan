import type { ActFn, Document } from "@deps";
import { patrol_unit } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, code, name },
		get,
	} = body.details;

	const pipeline: Document[] = [];

	const match: Record<string, any> = {};

	code &&
		(match["code"] = { $regex: new RegExp(code, "i") });
	name &&
		(match["name"] = { $regex: new RegExp(name, "i") });

	Object.keys(match).length > 0 && pipeline.push({ $match: match });

	pipeline.push({ $sort: { _id: -1 } });
	pipeline.push({ $skip: (page - 1) * limit });
	pipeline.push({ $limit: limit });

	return await patrol_unit
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};