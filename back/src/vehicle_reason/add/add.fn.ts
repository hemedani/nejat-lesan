import { type ActFn } from "@deps";
import { coreApp, vehicle_reason } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { ...rest } = set;

	return await vehicle_reason.insertOne({
		doc: rest,
		relations: {
			registrer: {
				_ids: user._id,
			},
		},
		projection: get,
	});
};
