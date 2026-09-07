import { type ActFn } from "@deps";
import { coreApp } from "../../../mod.ts";
import { transferStock, type MyContext } from "@lib";

export const transferFn: ActFn = async (body) => {
	const {
		set: { fromUnitId, toUnitId, wareId, quantity },
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	return await transferStock(
		fromUnitId as string,
		toUnitId as string,
		wareId as string,
		quantity as number,
		user._id.toString(),
	);
};
