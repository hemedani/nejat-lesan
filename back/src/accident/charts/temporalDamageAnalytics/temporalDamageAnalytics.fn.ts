/**
 * -----------------------------------------------------------------------------
 * FILE: temporalDamageAnalytics.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Returns a time-series showing the **monthly percentage** of accidents that
 * involve **at least one** of the selected vehicle damage sections.
 *
 * This function fully respects Lesan’s principle: **the client defines all filters,
 * and the server executes them efficiently using MongoDB’s native operators**.
 *
 * Key features:
 * - Default date range = last 3 Jalali years
 * - Default damage sections if none selected
 * - Flattens `vehicle_dtos[].max_damage_sections.name` into a single array per accident
 * - Uses `$setIntersection` to detect if any selected damage type is present
 * - Returns continuous monthly series (0% if no data)
 * - Applies **all filters** before aggregation for maximum performance
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const temporalDamageAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// =========================================================================
	// 1. DATE RANGE SETUP
	//    - Default: last 3 full Jalali years up to today
	// =========================================================================
	let startDate: moment.Moment, endDate: moment.Moment;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const startJalaliYear = now.jYear() - 3;
		startDate = moment(`${startJalaliYear}/01/01`, "jYYYY/jMM/jDD").startOf(
			"day",
		);
		endDate = moment().endOf("day");
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day");
		endDate = moment(filters.dateOfAccidentTo).endOf("day");
	}

	const matchFilter: Document = {
		date_of_accident: { $gte: startDate.toDate(), $lte: endDate.toDate() },
	};

	// =========================================================================
	// 2. APPLY CORE ACCIDENT FILTERS
	// =========================================================================
	if (filters.seri !== undefined) matchFilter.seri = filters.seri;
	if (filters.serial !== undefined) matchFilter.serial = filters.serial;
	if (filters.newsNumber !== undefined) {
		matchFilter.news_number = filters.newsNumber;
	}

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

	if (filters.hasWitness !== undefined) {
		matchFilter.has_witness = filters.hasWitness === "true";
	}

	if (filters.officer) {
		matchFilter.officer = { $regex: new RegExp(filters.officer, "i") };
	}

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
		maxDamageSections: "max_damage_sections.name", // ← critical for this chart
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

	// Exact & text fields
	const vehicleExactFields = [
		"vehicleInsuranceNo",
		"vehiclePrintNumber",
		"vehiclePlaqueSerialElement",
		"vehicleBodyInsuranceNo",
		"driverNationalCode",
		"driverLicenceNumber",
		"passengerNationalCode",
		"vehicleDamageSectionOther",
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

	// Numeric range
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
	// 7. DEFINE DAMAGE SECTIONS TO ANALYZE
	// =========================================================================
	const defaultDamageSections = [
		"سپر جلو",
		"سپر عقب",
		"درب موتور جلو",
		"چراغ جلو راست",
		"چراغ جلو چپ",
	];

	const damageSectionsToAnalyze =
		(filters.maxDamageSections && filters.maxDamageSections.length > 0)
			? filters.maxDamageSections
			: defaultDamageSections;

	// =========================================================================
	// 8. EXECUTE AGGREGATION PIPELINE
	//    - Flatten all damage sections from all vehicles in an accident
	//    - Group by month, count total and matching accidents
	//    - Compute percentage
	// =========================================================================
	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$addFields: {
				all_damage_sections: {
					$reduce: {
						input: "$vehicle_dtos",
						initialValue: [],
						in: {
							$concatArrays: [
								"$$value",
								{
									$ifNull: [
										"$$this.max_damage_sections.name",
										[],
									],
								},
							],
						},
					},
				},
			},
		},
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
				totalCount: { $sum: 1 },
				selectedTypesCount: {
					$sum: {
						$cond: {
							if: {
								$gt: [{
									$size: {
										$setIntersection: [
											"$all_damage_sections",
											damageSectionsToAnalyze,
										],
									},
								}, 0],
							},
							then: 1,
							else: 0,
						},
					},
				},
			},
		},
		{
			$project: {
				_id: 1,
				ratio: {
					$cond: {
						if: { $gt: ["$totalCount", 0] },
						then: {
							$multiply: [{
								$divide: ["$selectedTypesCount", "$totalCount"],
							}, 100],
						},
						else: 0,
					},
				},
			},
		},
		{ $sort: { "_id.year": 1, "_id.month": 1 } },
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// =========================================================================
	// 9. BUILD CONTINUOUS MONTHLY SERIES (Gregorian months for simplicity)
	// =========================================================================
	const resultsMap = new Map<string, number>();
	for (const r of dbResults) {
		const key = `${r._id.year}-${String(r._id.month).padStart(2, "0")}`;
		resultsMap.set(key, r.ratio);
	}

	const categories: string[] = [];
	const seriesData: number[] = [];
	let current = startDate.clone();

	while (current.isSameOrBefore(endDate, "month")) {
		const key = `${current.year()}-${
			String(current.month() + 1).padStart(2, "0")
		}`;
		categories.push(key);
		seriesData.push(resultsMap.get(key) || 0);
		current.add(1, "month");
	}

	// =========================================================================
	// 10. RETURN IN STANDARD FORMAT
	// =========================================================================
	return {
		analytics: {
			categories,
			series: [{ name: "سهم از کل تصادفات", data: seriesData }],
		},
	};
};
