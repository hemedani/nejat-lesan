import { type ActFn, Infer, object, ObjectId } from "@deps";
import { city, coreApp, user } from "../../../mod.ts";
import { user_pure } from "../../../models/user.ts";

export const updateUserFn: ActFn = async (body) => {
	// const {
	// 	user,
	// }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const {
		set: {
			_id,
			first_name,
			last_name,
			father_name,
			gender,
			birth_date,
			summary,

			address,
			citySettingId,
		},
		get,
	} = body.details;

	const pureStruct = object(user_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
		...(first_name && { first_name }),
		...(last_name && { last_name }),
		...(father_name && { father_name }),
		...(gender && { gender }),
		...(birth_date && { birth_date }),
		...(summary && { summary }),
		...(address && { address }),
	};

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
			updateObj.settings = {
				city: {
					_id: foundedCity._id,
					name: foundedCity.name,
					center_location: foundedCity.center_location,
				},
			};
		}
	}

	return await user.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
