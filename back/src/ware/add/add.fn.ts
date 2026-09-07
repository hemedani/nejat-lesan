import { type ActFn } from "@deps";
import { coreApp, ware } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	return await ware.insertOne({
		doc: set as Record<string, any>,
		relations: {
			registrer: {
				_ids: user._id,
			},
		},
		projection: get,
	});
};
