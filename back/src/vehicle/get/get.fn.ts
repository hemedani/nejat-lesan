import { type ActFn, ObjectId } from "@deps";
import { vehicle } from "../../../mod.ts";
import { throwError } from "@lib";

export const getVehicleFn: ActFn = async (body) => {
	const {
		set: { _id },
		get,
	} = body.details;

	const founded = await vehicle
		.aggregation({
			pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
			projection: get,
		})
		.toArray();
	founded.length < 1 && throwError("خودرو یافت نشد");
	return founded[0];
};
