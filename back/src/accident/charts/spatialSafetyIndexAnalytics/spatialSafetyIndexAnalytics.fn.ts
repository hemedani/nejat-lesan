/**
 * -----------------------------------------------------------------------------
 * FILE: spatialSafetyIndexAnalytics.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Returns **safety index metrics** (fatalities & total casualties per 100k population)
 * for a given spatial unit (**province**, **city**, or **city_zone**).
 *
 * This function fully respects Lesan’s principle: **the client defines all filters,
 * and the server executes them efficiently using MongoDB’s native operators**.
 *
 * Key features:
 * - Default date range = last Jalali year up to today
 * - Uses **embedded population data** (no `$lookup` needed)
 * - Applies **all filters** before aggregation
 * - Dynamically groups by user-selected spatial unit
 * - Handles embedded `vehicle_dtos`, `pedestrian_dtos` via `$elemMatch`
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const spatialSafetyIndexAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// =========================================================================
	// 1. DATE RANGE SETUP
	// =========================================================================
	let startDate: Date, endDate: Date;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const lastJalaliYear = now.jYear() - 1;
		startDate = moment(`${lastJalaliYear}/01/01`, "jYYYY/jMM/jDD").startOf(
			"day",
		).toDate();
		endDate = moment().endOf("day").toDate();
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day").toDate();
		endDate = moment(filters.dateOfAccidentTo).endOf("day").toDate();
	}

	const baseFilter: Document = {
		date_of_accident: { $gte: startDate, $lte: endDate },
	};

	// =========================================================================
	// 2. EXTRACT groupBy AND APPLY CORE FILTERS
	// =========================================================================
	const { groupBy, ...otherFilters } = filters;
	const spatialUnit = groupBy || "province";

	if (otherFilters.seri !== undefined) baseFilter.seri = otherFilters.seri;
	if (otherFilters.serial !== undefined) {
		baseFilter.serial = otherFilters.serial;
	}
	if (otherFilters.newsNumber !== undefined) {
		baseFilter.news_number = otherFilters.newsNumber;
	}

	if (otherFilters.deadCount !== undefined) {
		baseFilter.dead_count = otherFilters.deadCount;
	} else if (
		otherFilters.deadCountMin !== undefined ||
		otherFilters.deadCountMax !== undefined
	) {
		baseFilter.dead_count = {};
		if (otherFilters.deadCountMin !== undefined) {
			baseFilter.dead_count.$gte = otherFilters.deadCountMin;
		}
		if (otherFilters.deadCountMax !== undefined) {
			baseFilter.dead_count.$lte = otherFilters.deadCountMax;
		}
	}

	if (otherFilters.injuredCount !== undefined) {
		baseFilter.injured_count = otherFilters.injuredCount;
	} else if (
		otherFilters.injuredCountMin !== undefined ||
		otherFilters.injuredCountMax !== undefined
	) {
		baseFilter.injured_count = {};
		if (otherFilters.injuredCountMin !== undefined) {
			baseFilter.injured_count.$gte = otherFilters.injuredCountMin;
		}
		if (otherFilters.injuredCountMax !== undefined) {
			baseFilter.injured_count.$lte = otherFilters.injuredCountMax;
		}
	}

	if (otherFilters.hasWitness !== undefined) {
		baseFilter.has_witness = otherFilters.hasWitness === "true";
	}

	if (otherFilters.officer) {
		baseFilter.officer = { $regex: new RegExp(otherFilters.officer, "i") };
	}

	if (otherFilters.completionDateFrom || otherFilters.completionDateTo) {
		baseFilter.completion_date = {};
		if (otherFilters.completionDateFrom) {
			baseFilter.completion_date.$gte = new Date(
				otherFilters.completionDateFrom,
			);
		}
		if (otherFilters.completionDateTo) {
			baseFilter.completion_date.$lte = new Date(
				otherFilters.completionDateTo,
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
		const value = otherFilters[filterKey as keyof typeof otherFilters];
		if (Array.isArray(value) && value.length > 0) {
			baseFilter[dbPath] = { $in: value };
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
		const value = otherFilters[filterKey as keyof typeof otherFilters];
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
		if (otherFilters[field]) {
			const dbField = field
				.replace(/([A-Z])/g, "_$1")
				.toLowerCase()
				.replace("vehicle_", "")
				.replace("driver_", "driver.")
				.replace("passenger_", "passenger.");
			vehicleElemMatch[dbField] = otherFilters[field];
		}
	}

	if (otherFilters.driverFirstName) {
		vehicleElemMatch["driver.first_name"] = {
			$regex: new RegExp(otherFilters.driverFirstName, "i"),
		};
	}
	if (otherFilters.driverLastName) {
		vehicleElemMatch["driver.last_name"] = {
			$regex: new RegExp(otherFilters.driverLastName, "i"),
		};
	}
	if (otherFilters.passengerFirstName) {
		vehicleElemMatch["passenger.first_name"] = {
			$regex: new RegExp(otherFilters.passengerFirstName, "i"),
		};
	}
	if (otherFilters.passengerLastName) {
		vehicleElemMatch["passenger.last_name"] = {
			$regex: new RegExp(otherFilters.passengerLastName, "i"),
		};
	}

	// Insurance date ranges
	if (
		otherFilters.vehicleInsuranceDateFrom ||
		otherFilters.vehicleInsuranceDateTo
	) {
		vehicleElemMatch.insurance_date = {};
		if (otherFilters.vehicleInsuranceDateFrom) {
			vehicleElemMatch.insurance_date.$gte = new Date(
				otherFilters.vehicleInsuranceDateFrom,
			);
		}
		if (otherFilters.vehicleInsuranceDateTo) {
			vehicleElemMatch.insurance_date.$lte = new Date(
				otherFilters.vehicleInsuranceDateTo,
			);
		}
	}
	if (
		otherFilters.vehicleBodyInsuranceDateFrom ||
		otherFilters.vehicleBodyInsuranceDateTo
	) {
		vehicleElemMatch.body_insurance_date = {};
		if (otherFilters.vehicleBodyInsuranceDateFrom) {
			vehicleElemMatch.body_insurance_date.$gte = new Date(
				otherFilters.vehicleBodyInsuranceDateFrom,
			);
		}
		if (otherFilters.vehicleBodyInsuranceDateTo) {
			vehicleElemMatch.body_insurance_date.$lte = new Date(
				otherFilters.vehicleBodyInsuranceDateTo,
			);
		}
	}

	// Numeric range
	if (otherFilters.vehicleInsuranceWarrantyLimit !== undefined) {
		vehicleElemMatch.insurance_warranty_limit =
			otherFilters.vehicleInsuranceWarrantyLimit;
	} else if (
		otherFilters.vehicleInsuranceWarrantyLimitMin !== undefined ||
		otherFilters.vehicleInsuranceWarrantyLimitMax !== undefined
	) {
		vehicleElemMatch.insurance_warranty_limit = {};
		if (otherFilters.vehicleInsuranceWarrantyLimitMin !== undefined) {
			vehicleElemMatch.insurance_warranty_limit.$gte =
				otherFilters.vehicleInsuranceWarrantyLimitMin;
		}
		if (otherFilters.vehicleInsuranceWarrantyLimitMax !== undefined) {
			vehicleElemMatch.insurance_warranty_limit.$lte =
				otherFilters.vehicleInsuranceWarrantyLimitMax;
		}
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		baseFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
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
		const value = otherFilters[filterKey as keyof typeof otherFilters];
		if (Array.isArray(value) && value.length > 0) {
			pedestrianElemMatch[dbPath] = { $in: value };
		}
	}

	if (otherFilters.pedestrianNationalCode) {
		pedestrianElemMatch.national_code = otherFilters.pedestrianNationalCode;
	}
	if (otherFilters.pedestrianFirstName) {
		pedestrianElemMatch.first_name = {
			$regex: new RegExp(otherFilters.pedestrianFirstName, "i"),
		};
	}
	if (otherFilters.pedestrianLastName) {
		pedestrianElemMatch.last_name = {
			$regex: new RegExp(otherFilters.pedestrianLastName, "i"),
		};
	}

	if (Object.keys(pedestrianElemMatch).length > 0) {
		baseFilter.$and = baseFilter.$and || [];
		baseFilter.$and.push({
			pedestrian_dtos: { $elemMatch: pedestrianElemMatch },
		});
	}

	// =========================================================================
	// 6. ATTACHMENTS FILTERS
	// =========================================================================
	if (otherFilters.attachmentName) {
		baseFilter["attachments.name"] = {
			$regex: new RegExp(otherFilters.attachmentName, "i"),
		};
	}
	if (otherFilters.attachmentType) {
		baseFilter["attachments.type"] = otherFilters.attachmentType;
	}

	// =========================================================================
	// 7. EXECUTE DYNAMIC AGGREGATION PIPELINE
	// =========================================================================
	const locationNameField = `${spatialUnit}.name`;
	const populationField = `${spatialUnit}.population`;

	const pipeline: Document[] = [
		{ $match: baseFilter },
		{
			$match: {
				[locationNameField]: { $exists: true, $nin: [null, ""] },
				[populationField]: { $exists: true, $gt: 0 },
			},
		},
		{
			$group: {
				_id: `$${locationNameField}`,
				population: { $first: `$${populationField}` },
				totalDead: { $sum: "$dead_count" },
				totalInjured: { $sum: "$injured_count" },
			},
		},
		{
			$project: {
				_id: 0,
				name: "$_id",
				barChartMetric: {
					$multiply: [
						{ $divide: ["$totalDead", "$population"] },
						100000,
					],
				},
				mapChartMetric: {
					$multiply: [{
						$divide: [
							{ $add: ["$totalDead", "$totalInjured"] },
							"$population",
						],
					}, 100000],
				},
			},
		},
		{ $sort: { mapChartMetric: -1 } },
	];

	const analyticsData = await accident.aggregation({ pipeline }).toArray();

	// =========================================================================
	// 8. RETURN IN STANDARD FORMAT
	// =========================================================================
	return {
		analytics: analyticsData,
	};
};
