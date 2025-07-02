/**
 * -----------------------------------------------------------------------------
 * FILE: temporalNightAnalytics.fn.ts (Full Filters & Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline to count
 * accidents for each month, categorized by nighttime lighting conditions.
 * It includes a comprehensive filter-building stage for maximum data slicing.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const temporalNightAnalyticsFn: ActFn = async (body) => {
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
		// IMPORTANT: Hardcoded filter for "Nighttime" accidents as required by the chart.
		// FIX: Corrected "شب بدون روشنایی کافی" to "شب با نور ناکافی" to match the database schema.
		"light_status.name": {
			$in: ["شب با روشنایی کافی", "شب با نور ناکافی"],
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
	if (filters.injuredCountMin !== undefined) {
		matchFilter.injured_count = {
			...matchFilter.injured_count,
			$gte: filters.injuredCountMin,
		};
	}
	if (filters.injuredCountMax !== undefined) {
		matchFilter.injured_count = {
			...matchFilter.injured_count,
			$lte: filters.injuredCountMax,
		};
	}

	const arrayFilters: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		road: "road.name",
		accidentType: "type.name",
		position: "position.name",
		collisionType: "collision_type.name",
		roadSituation: "road_situation.name",
		roadSurfaceConditions: "road_surface_conditions.name",
		areaUsages: "area_usages.name",
		roadDefects: "road_defects.name",
		humanReasons: "human_reasons.name",
		vehicleReasons: "vehicle_reasons.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key].length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}

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
	if (filters.driverLicenceType && filters.driverLicenceType.length > 0) {
		vehicleElemMatch["driver.licence_type.name"] = {
			$in: filters.driverLicenceType,
		};
	}
	if (filters.driverInjuryType && filters.driverInjuryType.length > 0) {
		vehicleElemMatch["driver.injury_type.name"] = {
			$in: filters.driverInjuryType,
		};
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
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
					lightStatus: "$light_status.name",
				},
				count: { $sum: 1 },
			},
		},
		{ $sort: { "_id.year": 1, "_id.month": 1 } },
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// --- 4. Post-process to create a continuous time series ---
	const litNightMap = new Map<string, number>();
	const unlitNightMap = new Map<string, number>();

	dbResults.forEach((result) => {
		const key = `${result._id.year}-${
			String(result._id.month).padStart(2, "0")
		}`;
		if (result._id.lightStatus === "شب با روشنایی کافی") {
			litNightMap.set(key, result.count);
		} else if (result._id.lightStatus === "شب با نور ناکافی") { // FIX: Corrected string here as well.
			unlitNightMap.set(key, result.count);
		}
	});

	const categories: string[] = [];
	const litNightData: number[] = [];
	const unlitNightData: number[] = [];
	const current = startDate.clone();

	while (current.isBefore(endDate) || current.isSame(endDate, "month")) {
		const jalaliDate = moment(current.toDate()).locale("fa");
		const year = jalaliDate.jYear();
		const month = jalaliDate.jMonth() + 1;
		const key = `${current.year()}-${
			String(current.month() + 1).padStart(2, "0")
		}`;

		categories.push(`${year}-${String(month).padStart(2, "0")}`);
		litNightData.push(litNightMap.get(key) || 0);
		unlitNightData.push(unlitNightMap.get(key) || 0);

		current.add(1, "month");
	}

	// --- 5. Format and Return the Final Payload ---
	return {
		analytics: {
			categories: categories,
			series: [
				{ name: "شب با روشنایی کافی", data: litNightData },
				{ name: "شب بدون روشنایی کافی", data: unlitNightData },
			],
		},
	};
};
