import { type ActFn, ObjectId, type TInsertRelations } from "@deps";
import { city, coreApp, province, user } from "../../../mod.ts";
import type { user_relations } from "@model";

export const addUserFn: ActFn = async (body) => {
	const { set, get } = body.details;

	const {
		nationalCard,
		avatar,
		citySettingIds,
		provinceSettingIds,
		availableCharts,
		...rest
	} = set;

	const relations: TInsertRelations<typeof user_relations> = {};

	nationalCard &&
		(relations.national_card = {
			_ids: new ObjectId(nationalCard as string),
		});

	avatar &&
		(relations.avatar = {
			_ids: new ObjectId(avatar as string),
		});

	// Initialize settings object if it doesn't exist
	rest.settings = rest.settings || {};

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
		rest.settings.cities = foundedCities.map((city) => ({
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
		rest.settings.provinces = foundedProvinces.map((province) => ({
			_id: province._id,
			name: province.name,
			center_location: province.center_location,
		}));
	}

	// Add availableCharts to settings if provided
	if (availableCharts) {
		rest.settings.availableCharts = availableCharts;
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
