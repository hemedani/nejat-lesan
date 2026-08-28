import type { ActFn, Document } from "@deps";
import { shift, patrol_unit } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, code, name, is_active },
		get,
	} = body.details;

	const pipeline: Document[] = [];

	const match: Record<string, any> = {};

	code && (match["code"] = { $regex: new RegExp(code, "i") });
	name && (match["name"] = { $regex: new RegExp(name, "i") });
	is_active !== undefined && (match["is_active"] = is_active);

	Object.keys(match).length > 0 && pipeline.push({ $match: match });

	pipeline.push({ $sort: { _id: -1 } });
	pipeline.push({ $skip: (page - 1) * limit });
	pipeline.push({ $limit: limit });

	const units = await patrol_unit
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();

	if (units.length === 0) return [];

	const unitIds = units.map((u: any) => u._id);
	const activeShiftCounts = await shift.aggregation({
		pipeline: [
			{
				$match: {
					status: "active",
					"patrol_unit._id": { $in: unitIds },
				},
			},
			{ $group: { _id: "$patrol_unit._id", count: { $sum: 1 } } },
		],
	}).toArray();

	const countMap = new Map<string, number>(
		activeShiftCounts.map((c: any) => [c._id.toString(), c.count]),
	);

	return units.map((unit: any) => ({
		...unit,
		active_shift_count: countMap.get(unit._id.toString()) ?? 0,
	}));
};
