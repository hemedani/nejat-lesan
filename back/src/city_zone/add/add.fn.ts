import { type ActFn, ObjectId } from "@deps";
import { city_zone, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { cityId, ...rest } = set;

	return await city_zone.insertOne({
		doc: rest,
		relations: {
			city: {
				_ids: new ObjectId(cityId as string),
				relatedRelations: {
					city_zones: true,
				},
			},

			registrer: {
				_ids: user._id,
			},
		},
		projection: get,
	});
};
