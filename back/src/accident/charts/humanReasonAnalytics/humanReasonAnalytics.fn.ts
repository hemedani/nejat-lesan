/**
 * -----------------------------------------------------------------------------
 * FILE: humanReasonAnalytics.fn.ts (Full Filters & Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline to find
 * the top 8 human factors contributing to accidents.
 *
 * It works by:
 * 1.  Applying all user-selected filters (date, location, etc.).
 * 2.  De-normalizing the `human_reasons` array.
 * 3.  Excluding the "ندارد" (None) category as required.
 * 4.  Grouping by the `human_reasons.name` field and counting occurrences.
 * 5.  Sorting by the count to find the most frequent reasons.
 * 6.  Limiting the result to the top 8.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const humanReasonAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const lastYear = now.jYear() - 1;
		startDate = moment(`${lastYear}/01/01`, "jYYYY/jMM/jDD").startOf("day")
			.toDate();
		endDate = moment(`${lastYear}/12/01`, "jYYYY/jMM/jDD").endOf("jMonth")
			.endOf("day").toDate();
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day").toDate();
		endDate = moment(filters.dateOfAccidentTo).endOf("day").toDate();
	}

	// --- 2. Build Comprehensive Base Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate, $lte: endDate },
	};

	// --- Add all other user-selected filters ---
	const arrayFilters: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		road: "road.name",
		accidentType: "type.name",
		lightStatus: "light_status.name",
		collisionType: "collision_type.name",
		roadSituation: "road_situation.name",
		roadSurfaceConditions: "road_surface_conditions.name",
		humanReasons: "human_reasons.name",
		roadDefects: "road_defects.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key].length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}

	// --- Handle complex vehicle/driver filters with $elemMatch ---
	const vehicleElemMatch: Document = {};
	if (filters.vehicleSystem && filters.vehicleSystem.length > 0) {
		vehicleElemMatch["system.name"] = { $in: filters.vehicleSystem };
	}
	if (filters.driverSex && filters.driverSex.length > 0) {
		vehicleElemMatch["driver.sex.name"] = { $in: filters.driverSex };
	}
	if (filters.driverLicenceType && filters.driverLicenceType.length > 0) {
		vehicleElemMatch["driver.licence_type.name"] = {
			$in: filters.driverLicenceType,
		};
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
	}

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		// Stage 1: Filter documents based on all criteria.
		{ $match: matchFilter },

		// Stage 2: De-normalize the human_reasons array.
		{ $unwind: "$human_reasons" },

		// Stage 3: Exclude documents where the reason is "ندارد" or null.
		{ $match: { "human_reasons.name": { $nin: ["ندارد", null] } } },

		// Stage 4: Group by the human reason's name and count them.
		{
			$group: {
				_id: "$human_reasons.name",
				count: { $sum: 1 },
			},
		},

		// Stage 5: Sort by count to get the most frequent reasons.
		{ $sort: { count: -1 } },

		// Stage 6: Limit to the top 8 as required by the chart design.
		{ $limit: 8 },

		// Stage 7: Project into a clean { name, count } format for the frontend.
		{
			$project: {
				_id: 0,
				name: "$_id",
				count: "$count",
			},
		},
	];

	const analyticsData = await accident.aggregation({ pipeline }).toArray();

	// --- 4. Format and Return the Final Payload (Lesan Standard) ---
	return {
		analytics: analyticsData,
	};
};
