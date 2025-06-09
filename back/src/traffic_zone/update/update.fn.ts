import { type ActFn, type Infer, object, ObjectId } from "@deps";
import { traffic_zone } from "../../../mod.ts";
import { traffic_zone_pure } from "@model";

export const updateFn: ActFn = async (body) => {
	const {
		set: {
			_id,
			name,
			area,
		},
		get,
	} = body.details;

	const pureStruct = object(traffic_zone_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
	};

	name && (updateObj.name = name);
	area && (updateObj.area = area);

	return await traffic_zone.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
