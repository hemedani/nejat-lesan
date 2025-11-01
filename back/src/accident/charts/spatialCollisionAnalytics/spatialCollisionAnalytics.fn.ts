/**
 * -----------------------------------------------------------------------------
 * FILE: spatialCollisionAnalytics.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Returns **dual analytics** for spatial collision analysis **by city zone**:
 * 1. **Stacked bar chart**: Counts of each collision type per zone
 * 2. **Zonal map**: % of user-selected (or default) collision types among severe accidents per zone
 *
 * This function fully respects Lesan’s principle: **the client defines all filters,
 * and the server executes them efficiently using MongoDB’s native operators**.
 *
 * Key features:
 * - Default date range = last Jalali year up to today
 * - Applies **all filters** before aggregation
 * - Defaults to user’s city or "اهواز" if no city selected
 * - Uses `$facet` to run both aggregations in one roundtrip
 * - Handles embedded `vehicle_dtos`, `pedestrian_dtos` via `$elemMatch`
 */
import type { ActFn, Document } from "@deps";
import { accident, collision_type, coreApp } from "../../../../mod.ts";
import moment from "npm:jalali-moment";
import { MyContext } from "@lib";

export const spatialCollisionAnalyticsFn: ActFn = async (body) => {
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
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
	// 4. DEFAULT TO USER'S CITY OR "اهواز" IF NO CITY SELECTED
	// =========================================================================
	if (!baseFilter["city.name"]) {
		baseFilter["city.name"] = user.settings?.city?.name || "اهواز";
	}

	// =========================================================================
	// 5. APPLY VEHICLE_DTOs FILTERS ($elemMatch)
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
		baseFilter.$and = baseFilter.$and || [];
		baseFilter.$and.push({
			pedestrian_dtos: { $elemMatch: pedestrianElemMatch },
		});
	}

	// =========================================================================
	// 7. ATTACHMENTS FILTERS
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
	// 8. DEFINE COLLISION TYPES TO ANALYZE
	// =========================================================================
	const defaultCollisionTypes = ["برخورد وسیله نقلیه با یک وسیله نقلیه"];
	const collisionTypesToAnalyze =
		(filters.collisionType && filters.collisionType.length > 0)
			? filters.collisionType
			: defaultCollisionTypes;

	// =========================================================================
	// 9. EXECUTE $FACET AGGREGATION
	//    - Only zones with city_zone.name
	//    - Bar chart: all collision types
	//    - Map chart: % of selected types among severe accidents
	// =========================================================================
	const pipeline: Document[] = [
		{ $match: baseFilter },
		{ $match: { "city_zone.name": { $exists: true, $nin: [null, ""] } } },
		{
			$facet: {
				barChartData: [
					// ✅ Ensure collision_type.name exists and is valid
					{
						$match: {
							"collision_type.name": {
								$exists: true,
								$nin: [null, ""],
							},
						},
					},
					{
						$group: {
							_id: {
								location: "$city_zone.name",
								collisionType: "$collision_type.name",
							},
							count: { $sum: 1 },
						},
					},
					{
						$group: {
							_id: "$_id.location",
							counts: {
								$push: {
									k: "$_id.collisionType", // Now guaranteed to be valid
									v: "$count",
								},
							},
							total: { $sum: "$count" },
						},
					},
					{ $sort: { total: -1 } },
					{
						$project: {
							_id: 0,
							name: "$_id",
							counts: { $arrayToObject: "$counts" },
						},
					},
				],
				mapData: [
					{
						$group: {
							_id: "$city_zone.name",
							totalCount: { $sum: 1 },
							selectedCollisionTypeCount: {
								$sum: {
									$cond: [
										{
											$in: [
												"$collision_type.name",
												collisionTypesToAnalyze,
											],
										},
										1,
										0,
									],
								},
							},
						},
					},
					{
						$project: {
							_id: 0,
							name: "$_id",
							ratio: {
								$cond: {
									if: { $gt: ["$totalCount", 0] },
									then: {
										$multiply: [{
											$divide: [
												"$selectedCollisionTypeCount",
												"$totalCount",
											],
										}, 100],
									},
									else: 0,
								},
							},
						},
					},
				],
			},
		},
	];

	const results = await accident.aggregation({ pipeline }).toArray();
	const data = results[0] || { barChartData: [], mapData: [] };

	// =========================================================================
	// 10. GET ALL COLLISION TYPES FOR COMPLETE SERIES
	// =========================================================================
	const allCollisionTypes = (
		await collision_type.find({ filters: {}, projection: { name: 1 } })
			.toArray()
	).map((ct) => ct.name);

	const categories = data.barChartData.map((item: any) => item.name);
	const series = allCollisionTypes.map((type) => ({
		name: type,
		data: categories.map((cat) =>
			data.barChartData.find((d: any) => d.name === cat)?.counts[type] ||
			0
		),
	})).filter((s) => s.data.some((count) => count > 0)); // Only non-zero series

	// =========================================================================
	// 11. RETURN IN STANDARD FORMAT
	// =========================================================================
	return {
		analytics: {
			barChart: {
				categories,
				series,
			},
			mapChart: data.mapData,
		},
	};
};
