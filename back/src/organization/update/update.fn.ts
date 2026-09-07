import { type ActFn, ObjectId } from "@deps";
import { coreApp, organization } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext } from "@lib";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, headId, logoId, ...rest },
		get,
	} = body.details;

	const context = coreApp.contextFns.getContextModel() as MyContext;
	await assertOrgInActorScope(context.user, _id as string);

	const updateObj: Record<string, any> = { updatedAt: new Date() };

	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined) updateObj[key] = value;
	}

	await organization.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: { _id: 1 },
	});

	if (headId !== undefined) {
		await organization.addRelation({
			filters: { _id: new ObjectId(_id as string) },
			relations: {
				head: {
					_ids: headId ? [new ObjectId(headId as string)] : [],
				},
			},
			replace: true,
			projection: { _id: 1 },
		});
	}

	if (logoId !== undefined) {
		await organization.addRelation({
			filters: { _id: new ObjectId(_id as string) },
			relations: {
				logo: {
					_ids: logoId ? [new ObjectId(logoId as string)] : [],
				},
			},
			replace: true,
			projection: { _id: 1 },
		});
	}

	return await organization.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: get,
	});
};
