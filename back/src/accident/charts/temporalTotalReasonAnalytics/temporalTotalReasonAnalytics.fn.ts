/**
 * -----------------------------------------------------------------------------
 * FILE: temporalTotalReasonAnalytics.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Returns a **multi-series monthly time-series** for the **top 10 ultimate causes**
 * (`vehicle_dtos.driver.total_reason.name`) of accidents.
 *
 * This function fully respects Lesan’s principle: **the client defines all filters,
 * and the server executes them efficiently using MongoDB’s native operators**.
 *
 * Key features:
 * - Default date range = last 3 Jalali years up to today
 * - Applies **all filters** before aggregation
 * - Uses `$unwind` on `vehicle_dtos` to access per-driver `total_reason`
 * - Excludes null/missing `total_reason` entries
 * - Identifies top 10 reasons by total count
 * - Builds continuous monthly series for each reason
 * - Handles embedded `vehicle_dtos`, `pedestrian_dtos` via `$elemMatch`
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const temporalTotalReasonAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// =========================================================================
	// 1. DATE RANGE SETUP
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

	if (filters.deadCount !== undefined) {
		baseFilter.dead_count = filters.deadCount;
	} else if (
		filters.deadCountMin !== undefined || filters.deadCountMax !== undefined
	) {
		baseFilter.dead_count = {};
		if (filters.deadCountMin !== undefined) {
			baseFilter.dead_count.$gte = filters.deadCountMin;
		}
		if (filters.deadCountMax !== undefined) {
			baseFilter.dead_count.$lte = filters.deadCountMax;
		}
	}

	if (filters.injuredCount !== undefined) {
		baseFilter.injured_count = filters.injuredCount;
	} else if (
		filters.injuredCountMin !== undefined ||
		filters.injuredCountMax !== undefined
	) {
		baseFilter.injured_count = {};
		if (filters.injuredCountMin !== undefined) {
			baseFilter.injured_count.$gte = filters.injuredCountMin;
		}
		if (filters.injuredCountMax !== undefined) {
			baseFilter.injured_count.$lte = filters.injuredCountMax;
		}
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
	// 7. EXECUTE AGGREGATION PIPELINE
	//    - Unwind vehicles to access driver.total_reason
	//    - Exclude null/empty total_reason
	//    - Group by reason + month
	//    - Identify top 10 by total count
	// =========================================================================
	const pipeline: Document[] = [
		{ $match: baseFilter },
		{ $unwind: "$vehicle_dtos" },
		{
			$match: {
				"vehicle_dtos.driver.total_reason.name": {
					$exists: true,
					$nin: [null, ""],
				},
			},
		},
		{
			$group: {
				_id: {
					reason: "$vehicle_dtos.driver.total_reason.name",
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
		{
			$group: {
				_id: "$_id.reason",
				monthlyData: {
					$push: {
						year: "$_id.year",
						month: "$_id.month",
						count: "$count",
					},
				},
				totalCount: { $sum: "$count" },
			},
		},
		{ $sort: { totalCount: -1 } },
		{ $limit: 10 },
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// =========================================================================
	// 8. BUILD CONTINUOUS MONTHLY CATEGORIES (Jalali labels)
	// =========================================================================
	const categories: string[] = [];
	const current = startDate.clone();
	while (current.isSameOrBefore(endDate, "month")) {
		const jalali = moment(current.toDate()).locale("fa");
		const label = `${jalali.jYear()}-${
			String(jalali.jMonth() + 1).padStart(2, "0")
		}`;
		categories.push(label);
		current.add(1, "month");
	}

	// =========================================================================
	// 9. BUILD SERIES FOR TOP 10 REASONS
	// =========================================================================
	const series = dbResults.map((doc) => {
		const monthlyMap = new Map<string, number>();
		for (const m of doc.monthlyData) {
			const gregKey = `${m.year}-${String(m.month).padStart(2, "0")}`;
			monthlyMap.set(gregKey, m.count);
		}

		const data = categories.map((cat) => {
			const [jYear, jMonth] = cat.split("-").map(Number);
			const gDate = moment(`${jYear}/${jMonth}/01`, "jYYYY/jMM/jDD");
			const gregKey = `${gDate.year()}-${
				String(gDate.month() + 1).padStart(2, "0")
			}`;
			return monthlyMap.get(gregKey) || 0;
		});

		return { name: doc._id, data };
	});

	// =========================================================================
	// 10. RETURN IN STANDARD FORMAT
	// =========================================================================
	return {
		analytics: {
			categories,
			series,
		},
	};
};
