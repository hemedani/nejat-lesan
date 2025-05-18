import { type ActFn, ObjectId } from "@deps";
import { coreApp, police_station } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { commanderId, ...rest } = set;

	return await police_station.insertOne({
		doc: rest,
		relations: {
			registrer: {
				_ids: user._id,
			},
			commander: {
				_ids: new ObjectId(commanderId as string),
				relatedRelations: {
					police_station: true,
				},
			},
		},
		projection: get,
	});
};
