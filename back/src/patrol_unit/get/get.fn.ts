import { type ActFn, ObjectId } from "@deps";
import { patrol_unit } from "../../../mod.ts";
import { throwError } from "@lib";

export const getFn: ActFn = async (body) => {
	const {
		set: { _id },
		get,
	} = body.details;

	const founded = await patrol_unit
		.aggregation({
			pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
			projection: get,
		})
		.toArray();
	founded.length < 1 && throwError("گشت یافت نشد");
	return founded[0];
};