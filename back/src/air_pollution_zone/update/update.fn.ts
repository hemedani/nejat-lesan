import { type ActFn, type Infer, object, ObjectId } from "@deps";
import { air_pollution_zone } from "../../../mod.ts";
import { air_pollution_zone_pure } from "@model";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, name, area, population },
		get,
	} = body.details;

	const pureStruct = object(air_pollution_zone_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
	};

	name && (updateObj.name = name);
	area && (updateObj.area = area);
	population && (updateObj.population = population);

	return await air_pollution_zone.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
