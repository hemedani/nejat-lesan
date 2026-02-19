import { type ActFn, ObjectId, type TInsertRelations } from "@deps";
import type { city_relations } from "@model";
import { city } from "../../../mod.ts";

export const updateCityRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, province },
		get,
	} = body.details;

	const relations: TInsertRelations<typeof city_relations> = {};

	province &&
		(relations.province = {
			_ids: new ObjectId(province as string),
			relatedRelations: {
				cities: true,
				center: false,
			},
		});

	const updatedCity = await city.addRelation({
		filters: { _id: new ObjectId(_id as string) },
		relations,
		projection: get,
		replace: true,
	});

	return updatedCity;
};
