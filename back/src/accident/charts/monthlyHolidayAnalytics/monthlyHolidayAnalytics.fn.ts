/**
 * -----------------------------------------------------------------------------
 * FILE: monthlyHolidayAnalytics.fn.ts (Full Filters & Dynamic Dates)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The complete and optimized function. It builds a comprehensive filter object
 * based on all possible inputs before executing the aggregation pipeline.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

const getOfficialHolidaysForYear = (year: number) => {
	const holidays = [
		{ month: 1, day: 1 },
		{ month: 1, day: 2 },
		{ month: 1, day: 3 },
		{ month: 1, day: 4 },
		{ month: 1, day: 12 },
		{ month: 1, day: 13 },
		{ month: 3, day: 14 },
		{ month: 3, day: 15 },
		{ month: 11, day: 22 },
		{ month: 12, day: 29 },
	];
	return holidays.map((holiday) =>
		moment(`${year}/${holiday.month}/${holiday.day}`, "jYYYY/jM/jD").format(
			"YYYY-MM-DD",
		)
	);
};

export const monthlyHolidayAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom && !filters.dateOfAccidentTo) {
		const now = moment();
		const lastYear = now.jYear() - 1;
		startDate = moment(`${lastYear}/01/01`, "jYYYY/jMM/jDD").startOf("day");
		endDate = moment(`${lastYear}/12/01`, "jYYYY/jMM/jDD").endOf("jMonth")
			.endOf("day");
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day");
		endDate = moment(filters.dateOfAccidentTo).endOf("day");
	}

	// --- 2. Dynamically Generate Holiday List ---
	const startYear = startDate.jYear();
	const endYear = endDate.jYear();
	let officialHolidays: string[] = [];
	for (let year = startYear; year <= endYear; year++) {
		officialHolidays = officialHolidays.concat(
			getOfficialHolidaysForYear(year),
		);
	}

	// --- 3. Build Comprehensive Filter and Aggregation Pipeline ---
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate.toDate(), $lte: endDate.toDate() },
	};

	// --- Location & Context Filters (using $in for arrays) ---
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
		equipmentDamages: "equipment_damages.name",
		roadSurfaceConditions: "road_surface_conditions.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key].length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}

	// --- Vehicle/Driver/Passenger Filters (using $elemMatch) ---
	const vehicleElemMatch: Document = {};
	const vehicleArrayFilters: { [key: string]: string } = {
		vehicleColor: "color.name",
		vehicleSystem: "system.name",
		vehiclePlaqueType: "plaque_type.name",
		vehicleSystemType: "system_type.name",
		vehicleFaultStatus: "fault_status.name",
		vehicleInsuranceCo: "insurance_co.name",
		vehiclePlaqueUsage: "plaque_usage.name",
		vehicleBodyInsuranceCo: "body_insurance_co.name",
		vehicleMotionDirection: "motion_direction.name",
		vehicleMaxDamageSections: "max_damage_sections.name",
		driverSex: "driver.sex",
		driverLicenceType: "driver.licence_type.name",
		driverInjuryType: "driver.injury_type.name",
		driverTotalReason: "driver.total_reason.name",
	};

	for (const key in vehicleArrayFilters) {
		if (filters[key] && filters[key].length > 0) {
			vehicleElemMatch[vehicleArrayFilters[key]] = { $in: filters[key] };
		}
	}
	// Add regex searches for text fields within the vehicle
	if (filters.driverFirstName) {
		vehicleElemMatch["driver.first_name"] = {
			$regex: new RegExp(filters.driverFirstName, "i"),
		};
	}
	if (filters.driverLastName) {
		vehicleElemMatch["driver.last_name"] = {
			$regex: new RegExp(filters.driverLastName, "i"),
		};
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
	}

	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$project: {
				dayOfWeek: {
					$dayOfWeek: {
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
				dateString: {
					$dateToString: {
						format: "%Y-%m-%d",
						date: "$date_of_accident",
						timezone: "Asia/Tehran",
					},
				},
			},
		},
		{
			$addFields: {
				holidayStatus: {
					$cond: {
						if: {
							$or: [{ $eq: ["$dayOfWeek", 6] }, {
								$in: ["$dateString", officialHolidays],
							}],
						}, // Friday is 6 in MongoDB
						then: "Holiday",
						else: "Non-Holiday",
					},
				},
			},
		},
		{
			$group: {
				_id: { month: "$month", status: "$holidayStatus" },
				count: { $sum: 1 },
			},
		},
		{
			$group: {
				_id: "$_id.month",
				counts: { $push: { k: "$_id.status", v: "$count" } },
			},
		},
		{
			$project: {
				_id: 0,
				month: "$_id",
				stats: { $arrayToObject: "$counts" },
			},
		},
		{ $sort: { month: 1 } },
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// --- 4. Final Data Structuring ---
	const holidayData = Array(12).fill(0);
	const nonHolidayData = Array(12).fill(0);

	for (const result of dbResults) {
		const monthIndex = result.month - 1;
		if (monthIndex >= 0 && monthIndex < 12) {
			holidayData[monthIndex] = result.stats["Holiday"] || 0;
			nonHolidayData[monthIndex] = result.stats["Non-Holiday"] || 0;
		}
	}

	return {
		categories: [
			"فروردین",
			"اردیبهشت",
			"خرداد",
			"تیر",
			"مرداد",
			"شهریور",
			"مهر",
			"آبان",
			"آذر",
			"دی",
			"بهمن",
			"اسفند",
		],
		series: [
			{ name: "تعطیل", data: holidayData },
			{ name: "غیر تعطیل", data: nonHolidayData },
		],
	};
};
