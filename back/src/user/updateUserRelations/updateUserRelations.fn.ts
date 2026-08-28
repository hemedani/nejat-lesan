import { type ActFn, ObjectId, type TInsertRelations } from "@deps";
import type { user_relations as userRelations } from "@model";
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
		(relations.national_card = {
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
