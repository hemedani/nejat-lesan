import { type ActFn, ObjectId } from "@deps";
import { consumption, coreApp } from "../../../mod.ts";
import { getScopedUnitIds, type MyContext } from "@lib";

export const getsFn: ActFn = async (body) => {
	const {
		set: { page, limit, skip, unitId, wareId },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const match: Record<string, any> = {};

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

	const pipeline: Record<string, any>[] = [];
	if (Object.keys(match).length > 0) pipeline.push({ $match: match });
	pipeline.push({ $sort: { _id: -1 } });

	const finalSkip = skip || ((limit || 50) as number) * ((page || 1) - 1);
	pipeline.push({ $skip: finalSkip });
	pipeline.push({ $limit: limit || 50 });

	const data = await consumption
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();

	const totalCount = await consumption.countDocument({ filter: match });

	return { data, totalCount };
};
