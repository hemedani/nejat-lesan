import { type ActFn } from "@deps";
import { police_station } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, skip, name, is_active },
		get,
	} = body.details;

	const pipeline: Record<string, any>[] = [];

	if (name) {
		pipeline.push({
			$match: { name: { $regex: new RegExp(name as string, "i") } },
		});
	}

	if (is_active !== undefined) {
		pipeline.push({ $match: { is_active } });
	}

	pipeline.push({ $sort: { _id: -1 } });

	const finalSkip = skip || ((limit || 50) as number) * ((page || 1) - 1);
	pipeline.push({ $skip: finalSkip });
	pipeline.push({ $limit: limit || 50 });

	return await police_station
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
