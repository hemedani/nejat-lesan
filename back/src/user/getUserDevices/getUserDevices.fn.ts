import { type ActFn, ObjectId } from "@deps";
import { device } from "../../../mod.ts";

export const getUserDevicesFn: ActFn = async (body) => {
	const {
		set: { userId },
		get,
	} = body.details;

	return await device
		.find({
			filters: { "owner._id": new ObjectId(userId) },
			projection: get,
		})
		.toArray();
};
