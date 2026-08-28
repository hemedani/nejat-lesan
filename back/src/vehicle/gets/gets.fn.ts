import type { ActFn, Document } from "@deps";
import { ObjectId } from "@deps";
import { shift, vehicle } from "../../../mod.ts";

export const getVehiclesFn: ActFn = async (body) => {
	const {
		set: { page, limit, plaque, title, is_active, patrolUnitId },
		get,
	} = body.details;

	const match: Record<string, any> = {};

	if (plaque) {
		const plaqueRegex = { $regex: new RegExp(plaque, "i") };
		match["$or"] = [
			{ "plaque_no.0": plaqueRegex },
			{ "plaque_no.1": plaqueRegex },
			{ "plaque_no.2": plaqueRegex },
		];
	}
	title && (match["title"] = { $regex: new RegExp(title, "i") });
	is_active !== undefined && (match["is_active"] = is_active);
	patrolUnitId &&
		(match["patrol_unit._id"] = new ObjectId(patrolUnitId as string));

	const pipeline: Document[] = [];
	Object.keys(match).length > 0 && pipeline.push({ $match: match });
	pipeline.push({ $sort: { _id: -1 } });
	pipeline.push({ $skip: (page - 1) * limit });
	pipeline.push({ $limit: limit });

	const vehiclesFound = await vehicle
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();

	if (vehiclesFound.length === 0) return [];

	const vehicleIds = vehiclesFound.map((v: any) => v._id);
	const activeShiftCounts = await shift.aggregation({
		pipeline: [
			{
				$match: {
					status: "active",
					"vehicle._id": { $in: vehicleIds },
				},
			},
			{ $group: { _id: "$vehicle._id", count: { $sum: 1 } } },
		],
	}).toArray();

	const countMap = new Map<string, number>(
		activeShiftCounts.map((c: any) => [c._id.toString(), c.count]),
	);

	return vehiclesFound.map((v: any) => ({
		...v,
		active_shift_count: countMap.get(v._id.toString()) ?? 0,
	}));
};
