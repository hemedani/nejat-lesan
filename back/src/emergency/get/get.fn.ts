import { type ActFn, ObjectId } from "@deps";
import { emergency } from "../../../mod.ts";

export const getEmergencyFn: ActFn = async (body) => {
	const {
		set: { _id },
		get,
	} = body.details;

	return await emergency
		.aggregation({
			pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
			projection: get,
		})
		.toArray();
};
