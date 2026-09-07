import { type ActFn, ObjectId } from "@deps";
import { consumption, coreApp } from "../../../mod.ts";
import { getScopedUnitIds, type MyContext } from "@lib";

export const countFn: ActFn = async (body) => {
	const {
		set: { unitId, wareId },
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const match: Record<string, any> = {};

	const scoped = await getScopedUnitIds(user);
	if (scoped) {
		if (unitId) {
			if (!scoped.some((id) => id.toString() === (unitId as string))) {
				return { qty: 0 };
			}
		} else if (scoped.length === 0) {
			return { qty: 0 };
		} else {
			match["unit._id"] = { $in: scoped };
		}
	}

	if (unitId) match["unit._id"] = new ObjectId(unitId as string);
	if (wareId) match["ware._id"] = new ObjectId(wareId as string);

	return { qty: await consumption.countDocument({ filter: match }) };
};
