import { type ActFn, type Infer, object, ObjectId } from "@deps";
import { city } from "../../../mod.ts";
import { city_pure } from "@model";

export const updateFn: ActFn = async (body) => {
	const {
		set: {
			_id,
			name,
			area,

			english_name,
			center_location,
		},
		get,
	} = body.details;

	const pureStruct = object(city_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
	};

	name && (updateObj.name = name);
	english_name && (updateObj.english_name = english_name);
	area && (updateObj.area = area);
	center_location && (updateObj.center_location = center_location);
	// native_area && (updateObj.native_area = native_area);
	// non_native_area && (updateObj.non_native_area = non_native_area);
	// population && (updateObj.population = population);
	// area_number && (updateObj.area_number = area_number);

	return await city.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
