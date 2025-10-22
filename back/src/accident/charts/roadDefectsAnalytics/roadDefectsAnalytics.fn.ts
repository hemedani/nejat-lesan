/**
 * -----------------------------------------------------------------------------
 * FILE: roadDefectsAnalytics.fn.ts (FULLY COMPLETED FILTER LOGIC)
 * -----------------------------------------------------------------------------
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";

export const roadDefectsAnalyticsFn: ActFn = async (body) => {
	const { set } = body.details;

	const matchFilter: Document = {};

	// --- Core Accident Details ---
	if (set.seri !== undefined) matchFilter.seri = set.seri;
	if (set.serial !== undefined) matchFilter.serial = set.serial;

	// Date of Accident Range
	if (set.dateOfAccidentFrom || set.dateOfAccidentTo) {
		matchFilter.date_of_accident = {};
		if (set.dateOfAccidentFrom) {
			matchFilter.date_of_accident.$gte = new Date(set.dateOfAccidentFrom);
		}
		if (set.dateOfAccidentTo) {
			matchFilter.date_of_accident.$lte = new Date(set.dateOfAccidentTo);
		}
	}

	// Dead Count Filters
	if (set.deadCount !== undefined) {
		matchFilter.dead_count = set.deadCount;
	} else {
		if (set.deadCountMin !== undefined || set.deadCountMax !== undefined) {
			matchFilter.dead_count = {};
			if (set.deadCountMin !== undefined) matchFilter.dead_count.$gte = set.deadCountMin;
			if (set.deadCountMax !== undefined) matchFilter.dead_count.$lte = set.deadCountMax;
		}
	}

	// Injured Count Filters
	if (set.injuredCount !== undefined) {
		matchFilter.injured_count = set.injuredCount;
	} else {
		if (set.injuredCountMin !== undefined || set.injuredCountMax !== undefined) {
			matchFilter.injured_count = {};
			if (set.injuredCountMin !== undefined) matchFilter.injured_count.$gte = set.injuredCountMin;
			if (set.injuredCountMax !== undefined) matchFilter.injured_count.$lte = set.injuredCountMax;
		}
	}

	// Boolean-like string filter (e.g., "true"/"false")
	if (set.hasWitness !== undefined) {
		matchFilter.has_witness = set.hasWitness === "true";
	}

	if (set.newsNumber !== undefined) matchFilter.news_number = set.newsNumber;

	if (set.officer) {
		matchFilter.officer = { $regex: new RegExp(set.officer, "i") };
	}

	// Completion Date Range
	if (set.completionDateFrom || set.completionDateTo) {
		matchFilter.completion_date = {};
		if (set.completionDateFrom) {
			matchFilter.completion_date.$gte = new Date(set.completionDateFrom);
		}
		if (set.completionDateTo) {
			matchFilter.completion_date.$lte = new Date(set.completionDateTo);
		}
	}

	// --- Location & Context (multi-select arrays → $in) ---
	const locationFields = [
		{ key: "province", path: "province.name" },
		{ key: "city", path: "city.name" },
		{ key: "road", path: "road.name" },
		{ key: "trafficZone", path: "traffic_zone.name" },
		{ key: "cityZone", path: "city_zone.name" },
		{ key: "accidentType", path: "type.name" },
		{ key: "position", path: "position.name" },
		{ key: "rulingType", path: "ruling_type.name" },
		{ key: "lightStatus", path: "light_status.name" },
		{ key: "collisionType", path: "collision_type.name" },
		{ key: "roadSituation", path: "road_situation.name" },
		{ key: "roadRepairType", path: "road_repair_type.name" },
		{ key: "shoulderStatus", path: "shoulder_status.name" },
	];

	for (const { key, path } of locationFields) {
		if (Array.isArray(set[key]) && set[key].length > 0) {
			matchFilter[path] = { $in: set[key] };
		}
	}

	// --- Environmental & Reason-based ---
	const envReasonFields = [
		"areaUsages",
		"airStatuses",
		"roadDefects",
		"humanReasons",
		"vehicleReasons",
		"equipmentDamages",
		"roadSurfaceConditions",
	];

	for (const field of envReasonFields) {
		const dbPath = `${field.replace(/([A-Z])/g, "_$1").toLowerCase()}.name`;
		if (Array.isArray(set[field]) && set[field].length > 0) {
			matchFilter[dbPath] = { $in: set[field] };
		}
	}

	// --- Attachments ---
	if (set.attachmentName) {
		matchFilter["attachments.name"] = { $regex: new RegExp(set.attachmentName, "i") };
	}
	if (set.attachmentType) {
		matchFilter["attachments.type"] = set.attachmentType;
	}

	// --- Vehicle DTOs Filters ---
	const vehicleElemMatch: Document = {};

	const vehicleStringArrayFields = [
		{ key: "vehicleColor", path: "color.name" },
		{ key: "vehicleSystem", path: "system.name" },
		{ key: "vehiclePlaqueType", path: "plaque_type.name" },
		{ key: "vehicleSystemType", path: "system_type.name" },
		{ key: "vehicleFaultStatus", path: "fault_status.name" },
		{ key: "vehicleInsuranceCo", path: "insurance_co.name" },
		{ key: "vehiclePlaqueUsage", path: "plaque_usage.name" },
		{ key: "vehicleBodyInsuranceCo", path: "body_insurance_co.name" },
		{ key: "vehicleMotionDirection", path: "motion_direction.name" },
		{ key: "vehicleMaxDamageSections", path: "max_damage_sections.name" },
	];

	for (const { key, path } of vehicleStringArrayFields) {
		if (Array.isArray(set[key]) && set[key].length > 0) {
			vehicleElemMatch[path] = { $in: set[key] };
		}
	}

	// Exact string matches
	if (set.vehicleInsuranceNo) vehicleElemMatch["insurance_no"] = set.vehicleInsuranceNo;
	if (set.vehiclePrintNumber) vehicleElemMatch["print_number"] = set.vehiclePrintNumber;
	if (set.vehiclePlaqueSerialElement) vehicleElemMatch["plaque_serial_element"] = set.vehiclePlaqueSerialElement;
	if (set.vehicleDamageSectionOther) vehicleElemMatch["damage_section_other"] = set.vehicleDamageSectionOther;

	// Insurance date ranges
	if (set.vehicleInsuranceDateFrom || set.vehicleInsuranceDateTo) {
		vehicleElemMatch.insurance_date = {};
		if (set.vehicleInsuranceDateFrom) {
			vehicleElemMatch.insurance_date.$gte = new Date(set.vehicleInsuranceDateFrom);
		}
		if (set.vehicleInsuranceDateTo) {
			vehicleElemMatch.insurance_date.$lte = new Date(set.vehicleInsuranceDateTo);
		}
	}
	if (set.vehicleBodyInsuranceDateFrom || set.vehicleBodyInsuranceDateTo) {
		vehicleElemMatch.body_insurance_date = {};
		if (set.vehicleBodyInsuranceDateFrom) {
			vehicleElemMatch.body_insurance_date.$gte = new Date(set.vehicleBodyInsuranceDateFrom);
		}
		if (set.vehicleBodyInsuranceDateTo) {
			vehicleElemMatch.body_insurance_date.$lte = new Date(set.vehicleBodyInsuranceDateTo);
		}
	}

	// Numeric range: insurance warranty limit
	if (set.vehicleInsuranceWarrantyLimit !== undefined) {
		vehicleElemMatch.insurance_warranty_limit = set.vehicleInsuranceWarrantyLimit;
	} else {
		if (
			set.vehicleInsuranceWarrantyLimitMin !== undefined ||
			set.vehicleInsuranceWarrantyLimitMax !== undefined
		) {
			vehicleElemMatch.insurance_warranty_limit = {};
			if (set.vehicleInsuranceWarrantyLimitMin !== undefined)
				vehicleElemMatch.insurance_warranty_limit.$gte = set.vehicleInsuranceWarrantyLimitMin;
			if (set.vehicleInsuranceWarrantyLimitMax !== undefined)
				vehicleElemMatch.insurance_warranty_limit.$lte = set.vehicleInsuranceWarrantyLimitMax;
		}
	}

	// Driver in Vehicle
	const driverFields = [
		{ key: "driverSex", path: "driver.sex" },
		{ key: "driverLicenceType", path: "driver.licence_type.name" },
		{ key: "driverInjuryType", path: "driver.injury_type.name" },
		{ key: "driverTotalReason", path: "driver.total_reason.name" },
	];

	for (const { key, path } of driverFields) {
		if (Array.isArray(set[key]) && set[key].length > 0) {
			vehicleElemMatch[path] = { $in: set[key] };
		}
	}

	if (set.driverFirstName) {
		vehicleElemMatch["driver.first_name"] = { $regex: new RegExp(set.driverFirstName, "i") };
	}
	if (set.driverLastName) {
		vehicleElemMatch["driver.last_name"] = { $regex: new RegExp(set.driverLastName, "i") };
	}
	if (set.driverNationalCode) vehicleElemMatch["driver.national_code"] = set.driverNationalCode;
	if (set.driverLicenceNumber) vehicleElemMatch["driver.licence_number"] = set.driverLicenceNumber;

	// Passenger in Vehicle
	const passengerFields = [
		{ key: "passengerSex", path: "passenger.sex" },
		{ key: "passengerInjuryType", path: "passenger.injury_type.name" },
		{ key: "passengerFaultStatus", path: "passenger.fault_status.name" },
		{ key: "passengerTotalReason", path: "passenger.total_reason.name" },
	];

	for (const { key, path } of passengerFields) {
		if (Array.isArray(set[key]) && set[key].length > 0) {
			vehicleElemMatch[path] = { $in: set[key] };
		}
	}

	if (set.passengerFirstName) {
		vehicleElemMatch["passenger.first_name"] = { $regex: new RegExp(set.passengerFirstName, "i") };
	}
	if (set.passengerLastName) {
		vehicleElemMatch["passenger.last_name"] = { $regex: new RegExp(set.passengerLastName, "i") };
	}
	if (set.passengerNationalCode) vehicleElemMatch["passenger.national_code"] = set.passengerNationalCode;

	// Pedestrian DTOs (handled via separate array, not nested in vehicle)
	const pedestrianElemMatch: Document = {};

	const pedestrianFields = [
		{ key: "pedestrianSex", path: "sex" },
		{ key: "pedestrianInjuryType", path: "injury_type.name" },
		{ key: "pedestrianFaultStatus", path: "fault_status.name" },
		{ key: "pedestrianTotalReason", path: "total_reason.name" },
	];

	for (const { key, path } of pedestrianFields) {
		if (Array.isArray(set[key]) && set[key].length > 0) {
			pedestrianElemMatch[path] = { $in: set[key] };
		}
	}

	if (set.pedestrianFirstName) {
		pedestrianElemMatch.first_name = { $regex: new RegExp(set.pedestrianFirstName, "i") };
	}
	if (set.pedestrianLastName) {
		pedestrianElemMatch.last_name = { $regex: new RegExp(set.pedestrianLastName, "i") };
	}
	if (set.pedestrianNationalCode) pedestrianElemMatch.national_code = set.pedestrianNationalCode;

	// Apply $elemMatch if filters exist
	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
	}
	if (Object.keys(pedestrianElemMatch).length > 0) {
		matchFilter.pedestrian_dtos = { $elemMatch: pedestrianElemMatch };
	}

	// =========================================================================
	// STEP 2: Run Optimized Queries with the Full Filter
	// =========================================================================
	const withDefectQuery = {
		...matchFilter,
		"road_defects.name": { $nin: ["ندارد", null] },
	};

	const withoutDefectQuery = {
		...matchFilter,
		$or: [
			{ road_defects: { $exists: false } },
			{ road_defects: { $size: 0 } },
			{ road_defects: { $elemMatch: { name: "ندارد" } } },
		],
	};

	const [withDefectCount, withoutDefectCount, barChartData] = await Promise.all([
		accident.countDocument({ filter: withDefectQuery }),
		accident.countDocument({ filter: withoutDefectQuery }),
		accident
			.aggregation({
				pipeline: [
					{ $match: matchFilter },
					{ $match: { "road_defects.name": { $nin: ["ندارد", null] } } },
					{ $unwind: "$road_defects" },
					{
						$group: {
							_id: "$road_defects.name",
							count: { $sum: 1 },
						},
					},
					{ $sort: { count: -1 } },
					{ $limit: 10 },
					{
						$project: {
							_id: 0,
							name: "$_id",
							count: "$count",
						},
					},
				],
			})
			.toArray(),
	]);

	// =========================================================================
	// STEP 3: Format and Return
	// =========================================================================
	return {
		defectDistribution: {
			withDefect: withDefectCount as number,
			withoutDefect: withoutDefectCount as number,
		},
		defectCounts: barChartData,
	};
};
