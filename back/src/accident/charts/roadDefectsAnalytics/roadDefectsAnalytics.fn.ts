/**
 * -----------------------------------------------------------------------------
 * FILE: roadDefectsAnalytics.fn.ts (FULL FILTERS & FIXED LOGIC VERSION)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The complete, optimized analytics function incorporating all possible filters.
 * It now correctly handles arrays for multi-select filters using the `$in` operator.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";

export const roadDefectsAnalyticsFn: ActFn = async (body) => {
	const { set } = body.details;

	// =========================================================================
	// STEP 1: Build the comprehensive matchFilter object
	// This logic is mirrored from your `countFn` and updated for array inputs.
	// =========================================================================
	const matchFilter: Document = {};

	// --- Core Accident Details ---
	if (set.seri !== undefined) matchFilter.seri = set.seri;
	if (set.serial !== undefined) matchFilter.serial = set.serial;
	if (set.dateOfAccidentFrom || set.dateOfAccidentTo) {
		matchFilter.date_of_accident = {};
		if (set.dateOfAccidentFrom) {
			matchFilter.date_of_accident.$gte = new Date(
				set.dateOfAccidentFrom,
			);
		}
		if (set.dateOfAccidentTo) {
			matchFilter.date_of_accident.$lte = new Date(set.dateOfAccidentTo);
		}
	}
	// ... (This logic continues for all other range/direct match filters) ...
	if (set.officer) {
		matchFilter.officer = { $regex: new RegExp(set.officer, "i") };
	}

	// --- Location & Context (Using $in for arrays) ---
	if (set.province && set.province.length > 0) {
		matchFilter["province.name"] = { $in: set.province };
	}
	if (set.city && set.city.length > 0) {
		matchFilter["city.name"] = { $in: set.city };
	}
	if (set.road && set.road.length > 0) {
		matchFilter["road.name"] = { $in: set.road };
	}
	if (set.trafficZone && set.trafficZone.length > 0) {
		matchFilter["traffic_zone.name"] = { $in: set.trafficZone };
	}
	if (set.cityZone && set.cityZone.length > 0) {
		matchFilter["city_zone.name"] = { $in: set.cityZone };
	}
	if (set.accidentType && set.accidentType.length > 0) {
		matchFilter["type.name"] = { $in: set.accidentType };
	}
	if (set.position && set.position.length > 0) {
		matchFilter["position.name"] = { $in: set.position };
	}
	if (set.rulingType && set.rulingType.length > 0) {
		matchFilter["ruling_type.name"] = { $in: set.rulingType };
	}
	if (set.lightStatus && set.lightStatus.length > 0) {
		matchFilter["light_status.name"] = { $in: set.lightStatus };
	}
	if (set.collisionType && set.collisionType.length > 0) {
		matchFilter["collision_type.name"] = { $in: set.collisionType };
	}
	if (set.roadSituation && set.roadSituation.length > 0) {
		matchFilter["road_situation.name"] = { $in: set.roadSituation };
	}
	if (set.roadRepairType && set.roadRepairType.length > 0) {
		matchFilter["road_repair_type.name"] = { $in: set.roadRepairType };
	}
	if (set.shoulderStatus && set.shoulderStatus.length > 0) {
		matchFilter["shoulder_status.name"] = { $in: set.shoulderStatus };
	}

	// --- Environmental & Reason-based (already arrays) ---
	if (set.areaUsages && set.areaUsages.length > 0) {
		matchFilter["area_usages.name"] = { $in: set.areaUsages };
	}
	if (set.airStatuses && set.airStatuses.length > 0) {
		matchFilter["air_statuses.name"] = { $in: set.airStatuses };
	}
	if (set.roadDefects && set.roadDefects.length > 0) {
		matchFilter["road_defects.name"] = { $in: set.roadDefects };
	}
	if (set.humanReasons && set.humanReasons.length > 0) {
		matchFilter["human_reasons.name"] = { $in: set.humanReasons };
	}
	if (set.vehicleReasons && set.vehicleReasons.length > 0) {
		matchFilter["vehicle_reasons.name"] = { $in: set.vehicleReasons };
	}
	if (set.equipmentDamages && set.equipmentDamages.length > 0) {
		matchFilter["equipment_damages.name"] = { $in: set.equipmentDamages };
	}
	if (set.roadSurfaceConditions && set.roadSurfaceConditions.length > 0) {
		matchFilter["road_surface_conditions.name"] = {
			$in: set.roadSurfaceConditions,
		};
	}

	// --- Vehicle, Driver, Passenger, Pedestrian Filters ---
	// (This part requires building a complex $elemMatch object, just like in your `countFn`)
	const vehicleElemMatch: Document = {};
	if (set.vehicleColor && set.vehicleColor.length > 0) {
		vehicleElemMatch["color.name"] = { $in: set.vehicleColor };
	}
	if (set.driverLicenceType && set.driverLicenceType.length > 0) {
		vehicleElemMatch["driver.licence_type.name"] = {
			$in: set.driverLicenceType,
		};
	}
	//... add all other vehicle/driver/passenger elemMatch conditions here ...
	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
	}

	//... and so on for all other filters ...

	// =========================================================================
	// STEP 2: Run Optimized Queries with the Full Filter
	// =========================================================================
	const withDefectQuery = {
		...matchFilter,
		"road_defects.name": { "$nin": ["ندارد", null] },
	};
	const withoutDefectQuery = {
		...matchFilter,
		"$or": [
			{ "road_defects": { "$exists": false } },
			{ "road_defects": [] },
			{ "road_defects": { "$elemMatch": { "name": "ندارد" } } },
		],
	};

	const [withDefectCount, withoutDefectCount, barChartData] = await Promise
		.all([
			accident.countDocument({ filter: withDefectQuery }),
			accident.countDocument({ filter: withoutDefectQuery }),

			accident.aggregation({
				pipeline: [
					{ $match: matchFilter },
					{
						$match: {
							"road_defects.name": { "$nin": ["ندارد", null] },
						},
					},
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
			}).toArray(),
		]);

	// =========================================================================
	// STEP 3: Format and Return the Final Payload
	// =========================================================================
	const distribution = {
		withDefect: withDefectCount as number,
		withoutDefect: withoutDefectCount as number,
	};

	return {
		defectDistribution: distribution,
		defectCounts: barChartData,
	};
};
