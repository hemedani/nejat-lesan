import { type ActFn, ObjectId } from "@deps";
import { event } from "../../../mod.ts";

export const getFn: ActFn = async (body) => {
	const { _id } = body.details.set;
	const get = body.details.get;

	return await event.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: get,
	});
};
