import { type ActFn } from "@deps";
import { ware } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: {
			page,
			limit,
			skip,
			search,
			ware_type,
			ware_class,
			ware_group,
			ware_model,
			is_active,
		},
		get,
	} = body.details;

	const match: Record<string, any> = {};

	if (search) {
		const regex = new RegExp(search as string, "i");
		match.$or = [
			{ name: { $regex: regex } },
			{ enName: { $regex: regex } },
			{ brand: { $regex: regex } },
		];
	}
	if (ware_type) match.ware_type = ware_type;
	if (ware_class) match.ware_class = ware_class;
	if (ware_group) match.ware_group = ware_group;
	if (ware_model) match.ware_model = ware_model;
	if (is_active !== undefined) match.is_active = is_active;

	const pipeline: Record<string, any>[] = [];
	if (Object.keys(match).length > 0) pipeline.push({ $match: match });
	pipeline.push({ $sort: { _id: -1 } });

	const finalSkip = skip || ((limit || 50) as number) * ((page || 1) - 1);
	pipeline.push({ $skip: finalSkip });
	pipeline.push({ $limit: limit || 50 });

	return await ware
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
