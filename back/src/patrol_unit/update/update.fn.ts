import { type ActFn, ObjectId } from "@deps";
import { patrol_unit } from "../../../mod.ts";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, code, name, is_active },
		get,
	} = body.details;

	const updateObj: Record<string, any> = {
		updatedAt: new Date(),
	};

	code && (updateObj.code = code);
	name && (updateObj.name = name);
	is_active !== undefined && (updateObj.is_active = is_active);

	return await patrol_unit.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};