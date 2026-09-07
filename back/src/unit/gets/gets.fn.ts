import { type ActFn, ObjectId } from "@deps";
import { unit } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: {
			page,
			limit,
			skip,
			search,
			organizationId,
			roadId,
			type,
			parentUnitId,
			headId,
			is_active,
		},
		get,
	} = body.details;

	const match: Record<string, any> = {};

	if (search) {
		const regex = new RegExp(search as string, "i");
		match.$or = [
			{ code: { $regex: regex } },
			{ name: { $regex: regex } },
		];
	}
	if (organizationId) {
		match["organization._id"] = new ObjectId(organizationId as string);
	}
	if (roadId) match["road._id"] = new ObjectId(roadId as string);
	if (type) match.type = type;
	if (parentUnitId) {
		match["parentUnit._id"] = new ObjectId(parentUnitId as string);
	}
	if (headId) match["head._id"] = new ObjectId(headId as string);
	if (is_active !== undefined) match.is_active = is_active;

	const pipeline: Record<string, any>[] = [];
	if (Object.keys(match).length > 0) pipeline.push({ $match: match });
	pipeline.push({ $sort: { _id: -1 } });

	const finalSkip = skip || ((limit || 50) as number) * ((page || 1) - 1);
	pipeline.push({ $skip: finalSkip });
	pipeline.push({ $limit: limit || 50 });

	return await unit
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};
