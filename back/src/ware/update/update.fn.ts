import { type ActFn, ObjectId } from "@deps";
import { ware } from "../../../mod.ts";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, ...rest },
		get,
	} = body.details;

	const updateObj: Record<string, any> = { updatedAt: new Date() };

	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined) updateObj[key] = value;
	}

	return await ware.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: get,
	});
};
