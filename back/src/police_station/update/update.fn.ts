import { type ActFn, ObjectId } from "@deps";
import { police_station } from "../../../mod.ts";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, commanderId, ...rest },
		get,
	} = body.details;

	const updateObj: Record<string, any> = {
		updatedAt: new Date(),
	};

	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined) updateObj[key] = value;
	}

	await police_station.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: { _id: 1 },
	});

	if (commanderId) {
		await police_station.addRelation({
			filters: { _id: new ObjectId(_id as string) },
			relations: {
				commander: {
					_ids: [new ObjectId(commanderId as string)],
					relatedRelations: { police_station: true },
				},
			},
			replace: true,
			projection: { _id: 1 },
		});
	}

	return await police_station.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: get,
	});
};
