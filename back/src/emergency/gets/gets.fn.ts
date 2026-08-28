import { type ActFn, ObjectId } from "@deps";
import { emergency } from "../../../mod.ts";

export const getEmergenciesFn: ActFn = async (body) => {
	const {
		set: { page, limit, skip, status, officerId },
		get,
	} = body.details;

	const filters: Record<string, any> = {};

	if (status) filters.status = status;
	if (officerId) filters["officer._id"] = new ObjectId(officerId as string);

	const finalSkip = skip || (limit || 50) * ((page || 1) - 1);

	return await emergency
		.find({
			filters,
			projection: get,
		})
		.skip(finalSkip)
		.limit(limit || 50)
		.toArray();
};
