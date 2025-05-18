import { type ActFn, type Infer, object, ObjectId } from "@deps";
import { police_station } from "../../../mod.ts";
import { police_station_pure } from "@model";

export const updateFn: ActFn = async (body) => {
	const {
		set: {
			_id,
			name,
			area,
			location,
			code,
			is_active,
			military_rank,
		},
		get,
	} = body.details;

	const pureStruct = object(police_station_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
	};

	name && (updateObj.name = name);
	area && (updateObj.area = area);
	location && (updateObj.location = location);
	code && (updateObj.code = code);
	is_active && (updateObj.is_active = is_active);
	military_rank && (updateObj.military_rank = military_rank);

	return await police_station.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
