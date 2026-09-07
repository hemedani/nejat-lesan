import { type ActFn, ObjectId } from "@deps";
import { coreApp, inventory, unit } from "../../../mod.ts";
import { getScopedUnitIds, type MyContext } from "@lib";

export const countFn: ActFn = async (body) => {
	const {
		set: { organizationId, unitId, wareId, search },
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
	if (organizationId) {
		const orgUnits = await unit
			.find({
				filters: { "organization._id": new ObjectId(organizationId as string) },
				projection: { _id: 1 },
			})
			.toArray();
		const ids = orgUnits.map((u) => u._id);
		if (ids.length === 0) return { qty: 0 };
		if (match["unit._id"]) {
			match["unit._id"].$in = match["unit._id"].$in.filter((id: any) =>
				ids.some((i) => i.toString() === id.toString())
			);
		} else {
			match["unit._id"] = { $in: ids };
		}
	}
	if (search) {
		match["ware.name"] = { $regex: new RegExp(search as string, "i") };
	}

	return { qty: await inventory.countDocument({ filter: match }) };
};
