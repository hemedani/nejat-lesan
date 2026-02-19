/**
 * -----------------------------------------------------------------------------
 * FILE: monthlyHolidayAnalytics.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Analytics function that returns accident counts by month, split into
 * "Holiday" (Fridays + official Iranian holidays) and "Non-Holiday" days.
 *
 * This function fully respects the Lesan principle: the client defines all
 * filters, and the server executes them efficiently using MongoDB's native
 * operators on embedded documents—no joins, no post-processing.
 *
 * Key features:
 * - Dynamic holiday list generation based on Jalali calendar
 * - Timezone-aware date handling (Asia/Tehran)
 * - Full support for all filters defined in the validator
 * - Early filtering to minimize aggregation pipeline load
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

/**
 * Returns official Iranian holidays (fixed Jalali dates) for a given Gregorian year.
 * These are converted to Gregorian YYYY-MM-DD strings for MongoDB comparison.
 */
const getOfficialHolidaysForYear = (year: number): string[] => {
	const holidays = [
		{ month: 1, day: 1 }, // Nowruz
		{ month: 1, day: 2 },
		{ month: 1, day: 3 },
		{ month: 1, day: 4 },
		{ month: 1, day: 12 }, // Islamic Republic Day
		{ month: 1, day: 13 }, // Sizdah Bedar
		{ month: 3, day: 14 }, // Death of Khomeini
		{ month: 3, day: 15 }, // Khordad 15 Uprising
		{ month: 11, day: 22 }, // Ayatollah Khamenei's leadership
		{ month: 12, day: 29 }, // Anniversary of 1979 Revolution
	];
	return holidays.map((h) =>
		moment(`${year}/${h.month}/${h.day}`, "jYYYY/jM/jD").format(
			"YYYY-MM-DD",
		)
	);
};

export const monthlyHolidayAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// =========================================================================
	// 1. DATE RANGE SETUP
	//    - If no date range provided, default to last full Jalali year.
	//    - Always convert to Gregorian Date objects for MongoDB.
	// =========================================================================
	let startDate: moment.Moment, endDate: moment.Moment;
	if (!filters.dateOfAccidentFrom && !filters.dateOfAccidentTo) {
		const now = moment();
		const lastJalaliYear = now.jYear() - 1;
		startDate = moment(`${lastJalaliYear}/01/01`, "jYYYY/jMM/jDD").startOf(
			"day",
		);
		endDate = moment(`${lastJalaliYear}/12/01`, "jYYYY/jMM/jDD").endOf(
			"jMonth",
		).endOf("day");
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day");
		endDate = moment(filters.dateOfAccidentTo).endOf("day");
	}

	// Enforce date range in root match filter
	const matchFilter: Document = {
		date_of_accident: {
			$gte: startDate.toDate(),
			$lte: endDate.toDate(),
		},
	};

	// =========================================================================
	// 2. BUILD HOLIDAY CALENDAR FOR ENTIRE DATE RANGE
	//    - Generate holidays for every Gregorian year covered by the range.
	//    - Used later in $addFields to classify days.
	// =========================================================================
	const startYear = startDate.jYear();
	const endYear = endDate.jYear();
	const officialHolidays: string[] = [];
	for (let y = startYear; y <= endYear; y++) {
		officialHolidays.push(...getOfficialHolidaysForYear(y));
	}

	// =========================================================================
	// 3. APPLY CORE ACCIDENT FILTERS (ROOT-LEVEL FIELDS)
	// =========================================================================
	if (filters.seri !== undefined) matchFilter.seri = filters.seri;
	if (filters.serial !== undefined) matchFilter.serial = filters.serial;
	if (filters.newsNumber !== undefined) {
		matchFilter.news_number = filters.newsNumber;
	}

	// Numeric range: deadCount
	if (filters.deadCount !== undefined) {
		matchFilter.dead_count = filters.deadCount;
	} else if (
		filters.deadCountMin !== undefined || filters.deadCountMax !== undefined
	) {
		matchFilter.dead_count = {};
		if (filters.deadCountMin !== undefined) {
			matchFilter.dead_count.$gte = filters.deadCountMin;
		}
		if (filters.deadCountMax !== undefined) {
			matchFilter.dead_count.$lte = filters.deadCountMax;
		}
	}

	// Numeric range: injuredCount
	if (filters.injuredCount !== undefined) {
		matchFilter.injured_count = filters.injuredCount;
	} else if (
		filters.injuredCountMin !== undefined ||
		filters.injuredCountMax !== undefined
	) {
		matchFilter.injured_count = {};
		if (filters.injuredCountMin !== undefined) {
			matchFilter.injured_count.$gte = filters.injuredCountMin;
		}
		if (filters.injuredCountMax !== undefined) {
			matchFilter.injured_count.$lte = filters.injuredCountMax;
		}
	}

	// Boolean-like string
	if (filters.hasWitness !== undefined) {
		matchFilter.has_witness = filters.hasWitness === "true";
	}

	// Text search
	if (filters.officer) {
		matchFilter.officer = { $regex: new RegExp(filters.officer, "i") };
	}

	// Completion date range
	if (filters.completionDateFrom || filters.completionDateTo) {
		matchFilter.completion_date = {};
		if (filters.completionDateFrom) {
			matchFilter.completion_date.$gte = new Date(
				filters.completionDateFrom,
			);
		}
		if (filters.completionDateTo) {
			matchFilter.completion_date.$lte = new Date(
				filters.completionDateTo,
			);
		}
	}

	// =========================================================================
	// 4. APPLY ARRAY-BASED CONTEXT & ENVIRONMENTAL FILTERS ($in)
	//    - All these fields are embedded objects with a `.name` property.
	// =========================================================================
	const contextFields: Record<string, string> = {
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

	for (const [filterKey, dbPath] of Object.entries(contextFields)) {
		const value = filters[filterKey as keyof typeof filters];
		if (Array.isArray(value) && value.length > 0) {
			matchFilter[dbPath] = { $in: value };
		}
	}

	// =========================================================================
	// 5. APPLY VEHICLE_DTOs FILTERS ($elemMatch)
	// =========================================================================
	const vehicleElemMatch: Document = {};

	// Array-based nested filters
	const vehicleArrayFields: Record<string, string> = {
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
		passengerSex: "passenger.sex",
		passengerInjuryType: "passenger.injury_type.name",
		passengerFaultStatus: "passenger.fault_status.name",
		passengerTotalReason: "passenger.total_reason.name",
	};

	for (const [filterKey, dbPath] of Object.entries(vehicleArrayFields)) {
		const value = filters[filterKey as keyof typeof filters];
		if (Array.isArray(value) && value.length > 0) {
			vehicleElemMatch[dbPath] = { $in: value };
		}
	}

	// Exact string matches in vehicle
	const vehicleExactFields = [
		"vehicleInsuranceNo",
		"vehiclePrintNumber",
		"vehiclePlaqueSerialElement",
		"vehicleBodyInsuranceNo",
		"driverNationalCode",
		"driverLicenceNumber",
		"passengerNationalCode",
	] as const;

	for (const field of vehicleExactFields) {
		if (filters[field]) {
			const dbField = field
				.replace(/([A-Z])/g, "_$1")
				.toLowerCase()
				.replace("vehicle_", "")
				.replace("driver_", "driver.")
				.replace("passenger_", "passenger.");
			vehicleElemMatch[dbField] = filters[field];
		}
	}

	// Text search in vehicle
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
	if (filters.passengerFirstName) {
		vehicleElemMatch["passenger.first_name"] = {
			$regex: new RegExp(filters.passengerFirstName, "i"),
		};
	}
	if (filters.passengerLastName) {
		vehicleElemMatch["passenger.last_name"] = {
			$regex: new RegExp(filters.passengerLastName, "i"),
		};
	}

	// Vehicle insurance date ranges
	if (filters.vehicleInsuranceDateFrom || filters.vehicleInsuranceDateTo) {
		vehicleElemMatch.insurance_date = {};
		if (filters.vehicleInsuranceDateFrom) {
			vehicleElemMatch.insurance_date.$gte = new Date(
				filters.vehicleInsuranceDateFrom,
			);
		}
		if (filters.vehicleInsuranceDateTo) {
			vehicleElemMatch.insurance_date.$lte = new Date(
				filters.vehicleInsuranceDateTo,
			);
		}
	}
	if (
		filters.vehicleBodyInsuranceDateFrom ||
		filters.vehicleBodyInsuranceDateTo
	) {
		vehicleElemMatch.body_insurance_date = {};
		if (filters.vehicleBodyInsuranceDateFrom) {
			vehicleElemMatch.body_insurance_date.$gte = new Date(
				filters.vehicleBodyInsuranceDateFrom,
			);
		}
		if (filters.vehicleBodyInsuranceDateTo) {
			vehicleElemMatch.body_insurance_date.$lte = new Date(
				filters.vehicleBodyInsuranceDateTo,
			);
		}
	}

	// Vehicle numeric range
	if (filters.vehicleInsuranceWarrantyLimit !== undefined) {
		vehicleElemMatch.insurance_warranty_limit =
			filters.vehicleInsuranceWarrantyLimit;
	} else if (
		filters.vehicleInsuranceWarrantyLimitMin !== undefined ||
		filters.vehicleInsuranceWarrantyLimitMax !== undefined
	) {
		vehicleElemMatch.insurance_warranty_limit = {};
		if (filters.vehicleInsuranceWarrantyLimitMin !== undefined) {
			vehicleElemMatch.insurance_warranty_limit.$gte =
				filters.vehicleInsuranceWarrantyLimitMin;
		}
		if (filters.vehicleInsuranceWarrantyLimitMax !== undefined) {
			vehicleElemMatch.insurance_warranty_limit.$lte =
				filters.vehicleInsuranceWarrantyLimitMax;
		}
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
	}

	// =========================================================================
	// 6. APPLY PEDESTRIAN_DTOs FILTERS ($elemMatch)
	// =========================================================================
	const pedestrianElemMatch: Document = {};

	const pedestrianArrayFields: Record<string, string> = {
		pedestrianSex: "sex",
		pedestrianInjuryType: "injury_type.name",
		pedestrianFaultStatus: "fault_status.name",
		pedestrianTotalReason: "total_reason.name",
	};

	for (const [filterKey, dbPath] of Object.entries(pedestrianArrayFields)) {
		const value = filters[filterKey as keyof typeof filters];
		if (Array.isArray(value) && value.length > 0) {
			pedestrianElemMatch[dbPath] = { $in: value };
		}
	}

	// Exact & text fields for pedestrians
	if (filters.pedestrianNationalCode) {
		pedestrianElemMatch.national_code = filters.pedestrianNationalCode;
	}
	if (filters.pedestrianFirstName) {
		pedestrianElemMatch.first_name = {
			$regex: new RegExp(filters.pedestrianFirstName, "i"),
		};
	}
	if (filters.pedestrianLastName) {
		pedestrianElemMatch.last_name = {
			$regex: new RegExp(filters.pedestrianLastName, "i"),
		};
	}

	if (Object.keys(pedestrianElemMatch).length > 0) {
		matchFilter.pedestrian_dtos = { $elemMatch: pedestrianElemMatch };
	}

	// =========================================================================
	// 7. ATTACHMENTS FILTERS
	// =========================================================================
	if (filters.attachmentName) {
		matchFilter["attachments.name"] = {
			$regex: new RegExp(filters.attachmentName, "i"),
		};
	}
	if (filters.attachmentType) {
		matchFilter["attachments.type"] = filters.attachmentType;
	}

	// =========================================================================
	// 8. EXECUTE AGGREGATION PIPELINE
	//    - Classify each accident day as Holiday/Non-Holiday
	//    - Group by month and status
	// =========================================================================
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
				dateString: {
					$dateToString: {
						format: "%Y-%m-%d",
						date: "$date_of_accident",
						timezone: "Asia/Tehran",
					},
				},
				date_of_accident: 1,
			},
		},
		{
			$addFields: {
				holidayStatus: {
					$cond: {
						if: {
							$or: [
								{ $eq: ["$dayOfWeek", 6] }, // Friday = 6
								{ $in: ["$dateString", officialHolidays] },
							],
						},
						then: "Holiday",
						else: "Non-Holiday",
					},
				},
			},
		},
		{
			$group: {
				_id: { dateString: "$dateString", status: "$holidayStatus" },
				count: { $sum: 1 },
			},
		},
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// =========================================================================
	// 9. FORMAT RESPONSE FOR CHARTING
	//    - 12-month arrays (index 0 = Farvardin)
	//    - Persian month names as categories
	//    - Convert each date to Jalali month on the server side
	// =========================================================================
	const holidayData = Array(12).fill(0);
	const nonHolidayData = Array(12).fill(0);

	for (const { _id, count } of dbResults) {
		const { dateString, status } = _id;
		// Convert Gregorian date to Jalali month (1-12)
		const jalaliMonth = moment(dateString, "YYYY-MM-DD").jMonth() + 1; // jMonth() returns 0-11
		const idx = jalaliMonth - 1; // Convert to array index 0-11

		if (idx >= 0 && idx < 12) {
			if (status === "Holiday") {
				holidayData[idx] += count;
			} else {
				nonHolidayData[idx] += count;
			}
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
