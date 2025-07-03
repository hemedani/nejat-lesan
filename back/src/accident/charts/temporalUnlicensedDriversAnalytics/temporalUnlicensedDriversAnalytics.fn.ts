/**
 * -----------------------------------------------------------------------------
 * FILE: temporalUnlicensedDriversAnalytics.fn.ts (Full Filters & Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline to count
 * accidents over time where at least one driver was unlicensed.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const temporalUnlicensedDriversAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const startYear = now.jYear() - 3;
		startDate = moment(`${startYear}/01/01`, "jYYYY/jMM/jDD").startOf(
			"day",
		);
		endDate = moment().endOf("day");
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day");
		endDate = moment(filters.dateOfAccidentTo).endOf("day");
	}

	// --- 2. Build Comprehensive Base Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate.toDate(), $lte: endDate.toDate() },
		// IMPORTANT: Hardcoded filter to find accidents with at least one unlicensed driver.
		"vehicle_dtos": {
			$elemMatch: { "driver.licence_type.name": "فاقد گواهینامه" },
		},
	};

	// --- Add all other user-selected filters ---
	if (filters.officer) {
		matchFilter.officer = { $regex: new RegExp(filters.officer, "i") };
	}
	if (filters.deadCountMin !== undefined) {
		matchFilter.dead_count = {
			...matchFilter.dead_count,
			$gte: filters.deadCountMin,
		};
	}
	if (filters.deadCountMax !== undefined) {
		matchFilter.dead_count = {
			...matchFilter.dead_count,
			$lte: filters.deadCountMax,
		};
	}
	// ... Add other direct match and range filters ...

	const arrayFilters: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		road: "road.name",
		trafficZone: "traffic_zone.name",
		cityZone: "city_zone.name",
		accidentType: "type.name",
		position: "position.name",
		rulingType: "ruling_type.name",
		lightStatus: "light_status.name",
		collisionType: "collision_type.name",
		roadSituation: "road_situation.name",
		roadRepairType: "road_repair_type.name",
		shoulderStatus: "shoulder_status.name",
		areaUsages: "area_usages.name",
		airStatuses: "air_statuses.name",
		roadDefects: "road_defects.name",
		humanReasons: "human_reasons.name",
		vehicleReasons: "vehicle_reasons.name",
		roadSurfaceConditions: "road_surface_conditions.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key]?.length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}

	// --- Since we already have a primary $elemMatch, we must use $and for additional ones ---
	const additionalElemMatches = [];
	const vehicleElemMatch: Document = {};
	if (filters.vehicleSystem && filters.vehicleSystem.length > 0) {
		vehicleElemMatch["system.name"] = { $in: filters.vehicleSystem };
	}
	if (filters.vehicleFaultStatus && filters.vehicleFaultStatus.length > 0) {
		vehicleElemMatch["fault_status.name"] = {
			$in: filters.vehicleFaultStatus,
		};
	}
	if (filters.driverSex && filters.driverSex.length > 0) {
		vehicleElemMatch["driver.sex.name"] = { $in: filters.driverSex };
	}
	if (filters.driverInjuryType && filters.driverInjuryType.length > 0) {
		vehicleElemMatch["driver.injury_type.name"] = {
			$in: filters.driverInjuryType,
		};
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		additionalElemMatches.push({
			vehicle_dtos: { $elemMatch: vehicleElemMatch },
		});
	}

	if (additionalElemMatches.length > 0) {
		matchFilter.$and = (matchFilter.$and || []).concat(
			additionalElemMatches,
		);
	}

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$group: {
				_id: {
					year: {
						$year: {
							date: "$date_of_accident",
							timezone: "Asia/Tehran",
						},
					},
					month: {
						$month: {
							date: "$date_of_accident",
							timezone: "Asia/Tehran",
						},
					},
				},
				count: { $sum: 1 },
			},
		},
		{ $sort: { "_id.year": 1, "_id.month": 1 } },
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// --- 4. Post-process to create a continuous time series ---
	const resultsMap = new Map<string, number>();
	dbResults.forEach((result) => {
		const key = `${result._id.year}-${
			String(result._id.month).padStart(2, "0")
		}`;
		resultsMap.set(key, result.count);
	});

	const categories: string[] = [];
	const seriesData: number[] = [];
	const current = startDate.clone();

	while (current.isBefore(endDate) || current.isSame(endDate, "month")) {
		const jalaliDate = moment(current.toDate()).locale("fa");
		const year = jalaliDate.jYear();
		const month = jalaliDate.jMonth() + 1;
		const key = `${current.year()}-${
			String(current.month() + 1).padStart(2, "0")
		}`;

		categories.push(`${year}-${String(month).padStart(2, "0")}`);
		seriesData.push(resultsMap.get(key) || 0);

		current.add(1, "month");
	}

	// --- 5. Format and Return the Final Payload ---
	return {
		analytics: {
			categories: categories,
			series: [
				{
					name: "تعداد تصادفات رانندگان فاقد گواهینامه",
					data: seriesData,
				},
			],
		},
	};
};
