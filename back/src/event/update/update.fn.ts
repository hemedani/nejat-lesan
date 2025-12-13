import { type ActFn, ObjectId } from "@deps";
import { event } from "../../../mod.ts";

export const updateFn: ActFn = async (body) => {
	const { _id, name, description, dates } = body.details.set;
	const get = body.details.get;

	return await event.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		projection: get,
		update: {
			$set: {
				...(name !== undefined && { name }),
				...(description !== undefined && { description }),
				...(dates !== undefined && { dates }),
			},
		},
	});
};
