/**
 * -----------------------------------------------------------------------------
 * FILE: temporalCollisionAnalytics.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Returns a **monthly time-series** showing the **percentage of accidents**
 * that match **user-selected (or default) collision types**.
 *
 * This function fully respects Lesan’s principle: **the client defines all filters,
 * and the server executes them efficiently using MongoDB’s native operators**.
 *
 * Key features:
 * - Default date range = last 3 Jalali years up to today
 * - Default collision types if none selected
 * - Applies **all filters** before aggregation
 * - Groups by Gregorian year/month (for correct chronological order)
 * - Fills missing months with 0% for continuous charting
 * - Handles embedded `vehicle_dtos`, `pedestrian_dtos` via `$elemMatch`
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const temporalCollisionAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// =========================================================================
	// 1. DATE RANGE SETUP
	// =========================================================================
	let startDate: moment.Moment, endDate: moment.Moment;
	if (filters.dateOfAccidentFrom && filters.dateOfAccidentTo) {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day");
		endDate = moment(filters.dateOfAccidentTo).endOf("day");
	} else if (filters.dateOfAccidentFrom) {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day");
		endDate = moment().endOf("day");
	} else if (filters.dateOfAccidentTo) {
		const now = moment();
		const startJalaliYear = now.jYear() - 3;
		startDate = moment(`${startJalaliYear}/01/01`, "jYYYY/jMM/jDD").startOf("day");
		endDate = moment(filters.dateOfAccidentTo).endOf("day");
	} else {
		const now = moment();
		const startJalaliYear = now.jYear() - 3;
		startDate = moment(`${startJalaliYear}/01/01`, "jYYYY/jMM/jDD").startOf("day");
		endDate = moment().endOf("day");
	}

	const baseFilter: Document = {
		date_of_accident: { $gte: startDate.toDate(), $lte: endDate.toDate() },
	};

	// =========================================================================
	// 2. APPLY CORE ACCIDENT FILTERS
	// =========================================================================
	if (filters.seri !== undefined) baseFilter.seri = filters.seri;
	if (filters.serial !== undefined) baseFilter.serial = filters.serial;
	if (filters.newsNumber !== undefined) {
		baseFilter.news_number = filters.newsNumber;
	}

	const deadFilter: Document = {};
	let hasDeadFilter = false;

	if (filters.deadCount !== undefined) {
		deadFilter.dead_count = filters.deadCount;
		hasDeadFilter = true;
	} else if (
		filters.deadCountMin !== undefined || filters.deadCountMax !== undefined
	) {
		deadFilter.dead_count = {};
		if (filters.deadCountMin !== undefined) {
			deadFilter.dead_count.$gte = filters.deadCountMin;
		}
		if (filters.deadCountMax !== undefined) {
			deadFilter.dead_count.$lte = filters.deadCountMax;
		}
		hasDeadFilter = true;
	}

	const injuredFilter: Document = {};
	let hasInjuredFilter = false;

	if (filters.injuredCount !== undefined) {
		injuredFilter.injured_count = filters.injuredCount;
		hasInjuredFilter = true;
	} else if (
		filters.injuredCountMin !== undefined ||
		filters.injuredCountMax !== undefined
	) {
		injuredFilter.injured_count = {};
		if (filters.injuredCountMin !== undefined) {
			injuredFilter.injured_count.$gte = filters.injuredCountMin;
		}
		if (filters.injuredCountMax !== undefined) {
			injuredFilter.injured_count.$lte = filters.injuredCountMax;
		}
		hasInjuredFilter = true;
	}

	if (hasDeadFilter && hasInjuredFilter) {
		baseFilter.$or = [deadFilter, injuredFilter];
	} else if (hasDeadFilter) {
		Object.assign(baseFilter, deadFilter);
	} else if (hasInjuredFilter) {
		Object.assign(baseFilter, injuredFilter);
	}

	if (filters.hasWitness !== undefined) {
		baseFilter.has_witness = filters.hasWitness === "true";
	}

	if (filters.officer) {
		baseFilter.officer = { $regex: new RegExp(filters.officer, "i") };
	}

	if (filters.completionDateFrom || filters.completionDateTo) {
		baseFilter.completion_date = {};
		if (filters.completionDateFrom) {
			baseFilter.completion_date.$gte = new Date(
				filters.completionDateFrom,
			);
		}
		if (filters.completionDateTo) {
			baseFilter.completion_date.$lte = new Date(
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
		collisionType: "collision_type.name", // ← used in aggregation logic, not here
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
		// Skip collisionType — it's handled in aggregation
		if (filterKey === "collisionType") continue;
		const value = filters[filterKey as keyof typeof filters];
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
		baseFilter.pedestrian_dtos = { $elemMatch: pedestrianElemMatch };
	}

	// =========================================================================
	// 6. ATTACHMENTS FILTERS
	// =========================================================================
	if (filters.attachmentName) {
		baseFilter["attachments.name"] = {
			$regex: new RegExp(filters.attachmentName, "i"),
		};
	}
	if (filters.attachmentType) {
		baseFilter["attachments.type"] = filters.attachmentType;
	}

	// =========================================================================
	// 7. DEFINE COLLISION TYPES TO ANALYZE
	// =========================================================================
	const defaultCollisionTypes = [
		"برخورد وسیله نقلیه با شی ثابت",
		"واژگونی و سقوط",
		"خروج از جاده",
		"برخورد وسیله نقلیه با یک وسیله نقلیه",
		"برخورد وسیله نقلیه با عابر",
	];

	const collisionTypesToAnalyze =
		(filters.collisionType && filters.collisionType.length > 0)
			? filters.collisionType
			: defaultCollisionTypes;

	// =========================================================================
	// 8. EXECUTE AGGREGATION PIPELINE WITH DYNAMIC $facet
	//    - total: count ALL accidents per month (date range only)
	//    - type_0..type_N: count accidents matching ALL filters + specific type
	//    - Ratio = type_count / total * 100 for each month
	// =========================================================================
	const dateFilter: Document = {
		date_of_accident: { $gte: startDate.toDate(), $lte: endDate.toDate() },
	};

	const additionalFilters: Document = { ...baseFilter };
	delete additionalFilters.date_of_accident;

	const groupStage: Document = {
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
				day: {
					$dayOfMonth: {
						date: "$date_of_accident",
						timezone: "Asia/Tehran",
					},
				},
			},
			count: { $sum: 1 },
		},
	};

	const facetStages: Record<string, Document[]> = {
		total: [
			...(Object.keys(additionalFilters).length > 0
				? [{ $match: additionalFilters }]
				: []),
			groupStage,
		],
	};

	for (let i = 0; i < collisionTypesToAnalyze.length; i++) {
		const typeFilter: Document = { "collision_type.name": collisionTypesToAnalyze[i] };
		const mergedFilters: Document = { ...additionalFilters, ...typeFilter };
		facetStages[`type_${i}`] = [
			...(Object.keys(mergedFilters).length > 0
				? [{ $match: mergedFilters }]
				: []),
			groupStage,
		];
	}

	const pipeline: Document[] = [
		{ $match: dateFilter },
		{ $facet: facetStages },
	];

	const dbResult = await accident.aggregation({ pipeline }).toArray();
	const facetResult = dbResult[0] as Record<
		string,
		Array<{
			_id: { year: number; month: number; day: number };
			count: number;
		}>
	>;

	// =========================================================================
	// 9. BUILD TOTAL MAP: Convert Gregorian day-grouped results to Jalali months
	// =========================================================================
	const totalMap = new Map<string, number>();
	for (const r of facetResult.total || []) {
		const dateStr = `${r._id.year}-${
			String(r._id.month).padStart(2, "0")
		}-${String(r._id.day).padStart(2, "0")}`;
		const m = moment(dateStr, "YYYY-MM-DD");
		const jalaliKey = `${m.jYear()}-${
			String(m.jMonth() + 1).padStart(2, "0")
		}`;
		totalMap.set(jalaliKey, (totalMap.get(jalaliKey) || 0) + r.count);
	}

	// =========================================================================
	// 10. BUILD CONTINUOUS MONTHLY CATEGORIES
	// =========================================================================
	const categories: string[] = [];

	const current = startDate.clone().startOf("jMonth");
	const end = endDate.clone().endOf("jMonth");

	while (current.isSameOrBefore(end)) {
		const jalaliKey = `${current.jYear()}-${
			String(current.jMonth() + 1).padStart(2, "0")
		}`;
		categories.push(jalaliKey);
		current.add(1, "jMonth");
	}

	// =========================================================================
	// 11. BUILD PER-TYPE SERIES
	// =========================================================================
	const series: Array<{ name: string; data: number[] }> = [];

	for (let i = 0; i < collisionTypesToAnalyze.length; i++) {
		const typeName = collisionTypesToAnalyze[i];
		const typeKey = `type_${i}`;

		const typeMap = new Map<string, number>();
		for (const r of facetResult[typeKey] || []) {
			const dateStr = `${r._id.year}-${
				String(r._id.month).padStart(2, "0")
			}-${String(r._id.day).padStart(2, "0")}`;
			const m = moment(dateStr, "YYYY-MM-DD");
			const jalaliKey = `${m.jYear()}-${
				String(m.jMonth() + 1).padStart(2, "0")
			}`;
			typeMap.set(jalaliKey, (typeMap.get(jalaliKey) || 0) + r.count);
		}

		const data = categories.map((key) => {
			const total = totalMap.get(key) || 0;
			const count = typeMap.get(key) || 0;
			return total > 0 ? (count / total) * 100 : 0;
		});

		series.push({ name: typeName, data });
	}

	// =========================================================================
	// 12. RETURN IN STANDARD FORMAT
	// =========================================================================
	return {
		analytics: { categories, series },
	};
};
