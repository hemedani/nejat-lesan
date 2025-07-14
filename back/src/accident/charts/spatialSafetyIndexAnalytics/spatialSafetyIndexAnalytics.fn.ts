/**
 * -----------------------------------------------------------------------------
 * FILE: spatialSafetyIndexAnalytics.fn.ts (Full Filters & Corrected Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline to generate
 * all data required for the spatial safety index dashboard. It dynamically groups
 * data by province, city, or city_zone and uses the *embedded* population data
 * for calculations, avoiding the need for a slow `$lookup`.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const spatialSafetyIndexAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const lastYear = now.jYear() - 1;
		startDate = moment(`${lastYear}/01/01`, "jYYYY/jMM/jDD").startOf("day")
			.toDate();
		endDate = moment().endOf("day").toDate();
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day").toDate();
		endDate = moment(filters.dateOfAccidentTo).endOf("day").toDate();
	}

	// --- 2. Build Comprehensive Base Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate, $lte: endDate },
	};

	// --- Add all other user-selected filters ---
	const { groupBy, ...otherFilters } = filters; // Exclude groupBy from standard filters

	if (otherFilters.officer) {
		matchFilter.officer = { $regex: new RegExp(otherFilters.officer, "i") };
	}
	if (otherFilters.deadCountMin !== undefined) {
		matchFilter.dead_count = {
			...matchFilter.dead_count,
			$gte: otherFilters.deadCountMin,
		};
	}
	if (otherFilters.deadCountMax !== undefined) {
		matchFilter.dead_count = {
			...matchFilter.dead_count,
			$lte: otherFilters.deadCountMax,
		};
	}
	if (otherFilters.injuredCountMin !== undefined) {
		matchFilter.injured_count = {
			...matchFilter.injured_count,
			$gte: otherFilters.injuredCountMin,
		};
	}
	if (otherFilters.injuredCountMax !== undefined) {
		matchFilter.injured_count = {
			...matchFilter.injured_count,
			$lte: otherFilters.injuredCountMax,
		};
	}

	const arrayFilters: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		cityZone: "city_zone.name",
		accidentType: "type.name",
		position: "position.name",
		lightStatus: "light_status.name",
		collisionType: "collision_type.name",
		roadSituation: "road_situation.name",
	};

	for (const key in arrayFilters) {
		if (otherFilters[key] && otherFilters[key]?.length > 0) {
			matchFilter[arrayFilters[key]] = { $in: otherFilters[key] };
		}
	}

	const vehicleElemMatch: Document = {};
	if (otherFilters.vehicleSystem && otherFilters.vehicleSystem.length > 0) {
		vehicleElemMatch["system.name"] = { $in: otherFilters.vehicleSystem };
	}
	if (otherFilters.driverSex && otherFilters.driverSex.length > 0) {
		vehicleElemMatch["driver.sex.name"] = { $in: otherFilters.driverSex };
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
	}

	// --- 3. Define Dynamic Aggregation Fields ---
	const spatialUnit = groupBy || "province"; // Default to province if not specified
	// FIX: Removed the incorrect '$' prefix for use in $match keys.
	const locationNameField = `${spatialUnit}.name`;
	const populationField = `${spatialUnit}.population`;

	// --- 4. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		// Stage 1: Filter accidents based on user criteria.
		{ $match: matchFilter },
		// Stage 1.5: Ensure the chosen spatial unit and its population exist on the record
		{
			$match: {
				[locationNameField]: { $exists: true, $ne: null },
				[populationField]: { $exists: true, $gt: 0 },
			},
		},
		// Stage 2: Group accidents by the selected spatial unit to sum casualties.
		{
			$group: {
				// Here, the '$' prefix is correct because we are referencing the field's value.
				_id: `$${locationNameField}`,
				population: { $first: `$${populationField}` }, // Get the population for this group
				totalDead: { $sum: "$dead_count" },
				totalInjured: { $sum: "$injured_count" },
			},
		},
		// Stage 3: Calculate the final ratios.
		{
			$project: {
				_id: 0,
				name: "$_id",
				barChartMetric: { // Fatalities per 100k population
					$multiply: [
						{ $divide: ["$totalDead", "$population"] },
						100000,
					],
				},
				mapChartMetric: { // Total casualties per 100k population
					$multiply: [{
						$divide: [
							{ $add: ["$totalDead", "$totalInjured"] },
							"$population",
						],
					}, 100000],
				},
			},
		},
		// Stage 4: Sort by the map metric to show highest risk areas.
		{ $sort: { mapChartMetric: -1 } },
	];

	const analyticsData = await accident.aggregation({ pipeline }).toArray();

	// --- 5. Format and Return the Final Payload ---
	return {
		analytics: analyticsData,
	};
};
