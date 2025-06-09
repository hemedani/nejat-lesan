import { type ActFn, ObjectId, type TInsertRelations } from "@deps";
import { user } from "../../../mod.ts";
import type { user_relations } from "@model";

export const addUserFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const { nationalCard, avatar, ...rest } = set;

	const relations: TInsertRelations<typeof user_relations> = {};

	nationalCard &&
		(relations.national_card = {
			_ids: new ObjectId(nationalCard as string),
		});

	avatar &&
		(relations.avatar = {
			_ids: new ObjectId(avatar as string),
		});

	const addedUser = await user.insertOne({
		doc: {
			...rest,
		},
		relations,
		projection: get,
	});

	return addedUser;
};
