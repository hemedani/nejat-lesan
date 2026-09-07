import { type ActFn } from "@deps";
import { organization } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, skip, search, is_active },
		get,
	} = body.details;

	const pipeline: Record<string, any>[] = [];

	if (search) {
		const regex = new RegExp(search as string, "i");
		pipeline.push({
			$match: {
				$or: [
					{ code: { $regex: regex } },
					{ name: { $regex: regex } },
					{ enName: { $regex: regex } },
				],
			},
		});
	}

	if (is_active !== undefined) {
		pipeline.push({ $match: { is_active } });
	}

	pipeline.push({ $sort: { _id: -1 } });

	const finalSkip = skip || ((limit || 50) as number) * ((page || 1) - 1);
	pipeline.push({ $skip: finalSkip });
	pipeline.push({ $limit: limit || 50 });

	return await organization
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
