import type { ActFn, Document } from "@deps";
import { accident } from "../../../mod.ts";

export const getCreatedAtPeriodsFn: ActFn = async (body) => {
	const {
		set: { intervalMinutes = 10 },
	} = body.details;

	const intervalMs = intervalMinutes * 60 * 1000;

	const pipeline: Document[] = [
		{
			$group: {
				_id: {
					$subtract: [
						{ $toLong: "$createdAt" },
						{ $mod: [{ $toLong: "$createdAt" }, intervalMs] },
					],
				},
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
	];

	const buckets = await accident
		.aggregation({
			pipeline,
			projection: undefined,
		})
		.toArray();

	const periods: { from: number; to: number; count: number }[] = [];
	let current: { from: number; to: number; count: number } | null = null;

	for (const bucket of buckets) {
		const bucketTime = bucket._id as number;
		const bucketCount = bucket.count as number;

		if (current === null) {
			current = {
				from: bucketTime,
				to: bucketTime + intervalMs,
				count: bucketCount,
			};
		} else if (bucketTime - current.to < intervalMs) {
			current.to = bucketTime + intervalMs;
			current.count += bucketCount;
		} else {
			periods.push(current);
			current = {
				from: bucketTime,
				to: bucketTime + intervalMs,
				count: bucketCount,
			};
		}
	}

	if (current) periods.push(current);

	return { periods };
};
