import { type ActFn, ObjectId } from "@deps";
import { vehicle_reason } from "../../../mod.ts";

export const getFn: ActFn = async (body) => {
	const {
		set: { _id },
		get,
	} = body.details;

	return await vehicle_reason
		.aggregation({
			pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
			projection: get,
		})
		.toArray();
};
