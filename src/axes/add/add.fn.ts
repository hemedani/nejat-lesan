import { type ActFn, ObjectId } from "@deps";
import { axes, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { provinceId, ...rest } = set;

	return await axes.insertOne({
		doc: rest,
		relations: {
			registrer: {
				_ids: user._id,
			},
			province: {
				_ids: new ObjectId(provinceId as string),
				relatedRelations: {
					axeses: true,
				},
			},
		},
		projection: get,
	});
};
