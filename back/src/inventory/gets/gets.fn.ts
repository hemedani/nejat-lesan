import { type ActFn, ObjectId } from "@deps";
import { coreApp, inventory, unit } from "../../../mod.ts";
import { getScopedUnitIds, type MyContext } from "@lib";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, skip, organizationId, unitId, wareId, search },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const match: Record<string, any> = {};

	// --- Role scoping ---
	const scoped = await getScopedUnitIds(user);
	if (scoped) {
		if (unitId) {
			if (!scoped.some((id) => id.toString() === (unitId as string))) {
				return { data: [], totalCount: 0 };
			}
		} else if (scoped.length === 0) {
			return { data: [], totalCount: 0 };
		} else {
			match["unit._id"] = { $in: scoped };
		}
	}

	if (unitId) match["unit._id"] = new ObjectId(unitId as string);
	if (wareId) match["ware._id"] = new ObjectId(wareId as string);

	if (organizationId) {
		// تنزل به واحدهای آن سازمان
		const orgUnits = await unit
			.find({
				filters: { "organization._id": new ObjectId(organizationId as string) },
				projection: { _id: 1 },
			})
			.toArray();
		const ids = orgUnits.map((u) => u._id);
		if (ids.length === 0) return { data: [], totalCount: 0 };
		if (match["unit._id"]) {
			const existingIn = (match["unit._id"] as any)?.$in;
			if (existingIn) {
				match["unit._id"] = {
					$in: (existingIn as ObjectId[])
						.map((id) => id.toString())
						.filter((id) => ids.some((i) => i.toString() === id))
						.map((id) => new ObjectId(id)),
				};
			}
		} else {
			match["unit._id"] = { $in: ids };
		}
	}

	if (search) {
		match["ware.name"] = { $regex: new RegExp(search as string, "i") };
	}

	const pipeline: Record<string, any>[] = [];
	if (Object.keys(match).length > 0) pipeline.push({ $match: match });
	pipeline.push({ $sort: { _id: -1 } });

	const finalSkip = skip || ((limit || 50) as number) * ((page || 1) - 1);
	pipeline.push({ $skip: finalSkip });
	pipeline.push({ $limit: limit || 50 });

	const data = await inventory
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();

	const totalCount = await inventory.countDocument({ filter: match });

	return { data, totalCount };
};
