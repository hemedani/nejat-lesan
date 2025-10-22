/**
 * -----------------------------------------------------------------------------
 * FILE: hourlyDayOfWeekAnalytics.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Returns accident counts by hour (0–23) and day of week (Saturday–Friday)
 * for a heatmap visualization.
 *
 * This function embodies Lesan’s core principle: **the client defines all filters,
 * and the server executes them efficiently using MongoDB’s native operators**.
 *
 * Key features:
 * - Default date range = last full Jalali year if none provided
 * - Timezone-aware extraction of hour/day (Asia/Tehran)
 * - Full support for every filter in the validator
 * - Early-stage filtering to minimize aggregation load
 * - Returns a 7×24 grid (all zeros if no data) for consistent UI rendering
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const hourlyDayOfWeekAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// =========================================================================
	// 1. DATE RANGE SETUP
	//    - Default to last full Jalali year if no range provided.
	//    - Convert to Gregorian Date objects for MongoDB.
	// =========================================================================
	let startDate: Date, endDate: Date;
	if (!filters.dateOfAccidentFrom && !filters.dateOfAccidentTo) {
		const now = moment();
		const lastJalaliYear = now.jYear() - 1;
		startDate = moment(`${lastJalaliYear}/01/01`, "jYYYY/jMM/jDD").startOf(
			"day",
		).toDate();
		endDate = moment(`${lastJalaliYear}/12/01`, "jYYYY/jMM/jDD").endOf(
			"jMonth",
		).endOf("day").toDate();
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day").toDate();
		endDate = moment(filters.dateOfAccidentTo).endOf("day").toDate();
	}

	// Start with date range in root match filter
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate, $lte: endDate },
	};

	// =========================================================================
	// 2. APPLY CORE ACCIDENT FILTERS (ROOT-LEVEL)
	// =========================================================================
	if (filters.seri !== undefined) matchFilter.seri = filters.seri;
	if (filters.serial !== undefined) matchFilter.serial = filters.serial;
	if (filters.newsNumber !== undefined) {
		matchFilter.news_number = filters.newsNumber;
	}

	// Dead count: exact or range
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

	// Injured count: exact or range
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
	// 3. APPLY ARRAY-BASED CONTEXT & ENVIRONMENTAL FILTERS ($in)
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
	// 4. APPLY VEHICLE_DTOs FILTERS ($elemMatch)
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

	// Exact string matches
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

	// Insurance date ranges
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

	// Numeric range: insurance warranty limit
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
	// 5. APPLY PEDESTRIAN_DTOs FILTERS ($elemMatch)
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
	// 6. ATTACHMENTS FILTERS
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
	// 7. EXECUTE AGGREGATION PIPELINE
	//    - Extract day of week (1=Sunday, 7=Saturday) and hour (0–23)
	//    - Group by { day, hour }
	// =========================================================================
	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$group: {
				_id: {
					dayOfWeek: {
						$dayOfWeek: {
							date: "$date_of_accident",
							timezone: "Asia/Tehran",
						},
					},
					hour: {
						$hour: {
							date: "$date_of_accident",
							timezone: "Asia/Tehran",
						},
					},
				},
				count: { $sum: 1 },
			},
		},
		{
			$project: {
				_id: 0,
				day: "$_id.dayOfWeek",
				hour: "$_id.hour",
				count: "$count",
			},
		},
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// =========================================================================
	// 8. FORMAT FOR HEATMAP (7 days × 24 hours)
	//    - Order: Saturday (6) → Friday (5) → ... → Sunday (1)
	//    - But UI expects: Saturday at bottom → Sunday at top → so we reverse
	// =========================================================================
	const daysOfWeek = [
		{ name: "شنبه", dbIndex: 7 }, // Saturday
		{ name: "یکشنبه", dbIndex: 1 }, // Sunday
		{ name: "دوشنبه", dbIndex: 2 }, // Monday
		{ name: "سه‌شنبه", dbIndex: 3 }, // Tuesday
		{ name: "چهارشنبه", dbIndex: 4 }, // Wednesday
		{ name: "پنج‌شنبه", dbIndex: 5 }, // Thursday
		{ name: "جمعه", dbIndex: 6 }, // Friday
	];

	const series = daysOfWeek.map((day) => ({
		name: day.name,
		data: Array(24).fill(0),
	}));

	for (const { day, hour, count } of dbResults) {
		const dayIndex = daysOfWeek.findIndex((d) => d.dbIndex === day);
		if (dayIndex !== -1 && hour >= 0 && hour < 24) {
			series[dayIndex].data[hour] = count;
		}
	}

	// Reverse so Sunday appears at top of heatmap, Saturday at bottom
	return { series: series.reverse() };
};
