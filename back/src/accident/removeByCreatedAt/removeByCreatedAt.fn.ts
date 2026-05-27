import type { ActFn } from "@deps";
import { accident } from "../../../mod.ts";

export const removeByCreatedAtFn: ActFn = async (body) => {
	const {
		set: { createdAt, hoursBefore = 2, hoursAfter = 2 },
	} = body.details;

	const createdAtDate = new Date(createdAt);
	const fromDate = new Date(
		createdAtDate.getTime() - hoursBefore * 60 * 60 * 1000,
	);
	const toDate = new Date(
		createdAtDate.getTime() + hoursAfter * 60 * 60 * 1000,
	);

	const accidentsToDelete = await accident.find({
		filters: {
			createdAt: {
				$gte: fromDate,
				$lte: toDate,
			},
		},
		projection: { _id: 1 },
	});

	const foundedDocs = await accidentsToDelete.toArray();

	let deletedCount = 0;
	for (const acc of foundedDocs) {
		try {
			await accident.deleteOne({
				filter: { _id: acc._id },
				hardCascade: false,
			});
			deletedCount++;
		} catch (_e) {
			continue;
		}
	}

	return {
		success: 1,
		deletedCount,
	};
};
