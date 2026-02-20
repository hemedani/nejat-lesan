import { type ActFn, Infer, object, ObjectId } from "@deps";
import { city, coreApp, province, user } from "../../../mod.ts";
import { user_pure } from "../../../models/user.ts";

export const updateUserFn: ActFn = async (body) => {
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
			level,
			is_verified,
			citySettingIds,
			provinceSettingIds,
			availableCharts,
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
		...(level && { level }),
		...(is_verified !== undefined && { is_verified }),
	};

	// Handle settings updates
	if (citySettingIds || provinceSettingIds || availableCharts) {
		const settings: {
			cities?: {
				_id: ObjectId;
				name: string;
				center_location: {
					type: "Point";
					coordinates: number[];
				};
			}[];
			provinces?: {
				_id: ObjectId;
				name: string;
				center_location: {
					type: "Point";
					coordinates: number[];
				};
			}[];
			availableCharts?: typeof availableCharts;
		} = {};

		// Handle multiple cities
		if (
			citySettingIds && Array.isArray(citySettingIds) &&
			citySettingIds.length > 0
		) {
			const cityPureProjection = coreApp.schemas.createProjection(
				"city",
				"Pure",
			);

			// Convert string IDs to ObjectId instances
			const objectIds = citySettingIds.map((id) =>
				new ObjectId(id as string)
			);

			const foundedCities = await city.find({
				filters: { _id: { $in: objectIds } },
				projection: cityPureProjection,
			}).toArray();

			// Map the cities to the required format
			settings.cities = foundedCities.map((city) => ({
				_id: city._id,
				name: city.name,
				center_location: city.center_location,
			}));
		}

		// Handle multiple provinces
		if (
			provinceSettingIds && Array.isArray(provinceSettingIds) &&
			provinceSettingIds.length > 0
		) {
			const provincePureProjection = coreApp.schemas.createProjection(
				"province",
				"Pure",
			);

			// Convert string IDs to ObjectId instances
			const objectIds = provinceSettingIds.map((id) =>
				new ObjectId(id as string)
			);

			const foundedProvinces = await province.find({
				filters: { _id: { $in: objectIds } },
				projection: provincePureProjection,
			}).toArray();

			// Map the provinces to the required format
			settings.provinces = foundedProvinces.map((province) => ({
				_id: province._id,
				name: province.name,
				center_location: province.center_location,
			}));
		}

		// Add availableCharts to settings if provided
		if (availableCharts) {
			settings.availableCharts = availableCharts;
		}

		updateObj.settings = settings as any;
	}

	console.log("Update Object:", updateObj);

	return await user.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
