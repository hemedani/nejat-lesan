import { type ActFn, ObjectId, type TInsertRelations } from "@deps";
import { city, coreApp, user } from "../../../mod.ts";
import type { user_relations } from "@model";

export const addUserFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const { nationalCard, avatar, citySettingId, ...rest } = set;

	const relations: TInsertRelations<typeof user_relations> = {};

	nationalCard &&
		(relations.national_card = {
			_ids: new ObjectId(nationalCard as string),
		});

	avatar &&
		(relations.avatar = {
			_ids: new ObjectId(avatar as string),
		});

	if (citySettingId) {
		const cityPureProjection = coreApp.schemas.createProjection(
			"city",
			"Pure",
		);

		const foundedCity = await city.findOne({
			filters: { _id: new ObjectId(citySettingId as string) },
			projection: cityPureProjection,
		});

		if (foundedCity) {
			rest.settings = {
				city: {
					_id: foundedCity._id,
					name: foundedCity.name,
					center_location: foundedCity.center_location,
				},
			};
		}
	}

	const addedUser = await user.insertOne({
		doc: {
			...rest,
		},
		relations,
		projection: get,
	});

	return addedUser;
};
