import { type ActFn, ObjectId, type TInsertRelations } from "@deps";
import type { userRelations } from "@lib";
import { user } from "../../../mod.ts";

export const updateUserRelationsFn: ActFn = async (body) => {
	const {
		set: { _id, avatar, nationalCard },
		get,
	} = body.details;

	const relations: TInsertRelations<typeof userRelations> = {};

	avatar &&
		(relations.avatar = {
			_ids: new ObjectId(avatar),
			relatedRelations: {},
		});

	nationalCard &&
		(relations.nationalCard = {
			_ids: new ObjectId(nationalCard),
			relatedRelations: {},
		});

	return await user.addRelation({
		filters: { _id: new ObjectId(_id as string) },
		relations,
		projection: get,
		replace: true,
	});
};
