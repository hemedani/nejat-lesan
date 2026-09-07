import { type ActFn, ObjectId } from "@deps";
import { coreApp, goods_receipt } from "../../../mod.ts";
import { getScopedUnitIds, type MyContext } from "@lib";

export const countFn: ActFn = async (body) => {
	const {
		set: { unitId, status },
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
			match["receiving_unit._id"] = { $in: scoped };
		}
	}

	if (unitId) match["receiving_unit._id"] = new ObjectId(unitId as string);
	if (status) match.status = status;

	return { qty: await goods_receipt.countDocument({ filter: match }) };
};
