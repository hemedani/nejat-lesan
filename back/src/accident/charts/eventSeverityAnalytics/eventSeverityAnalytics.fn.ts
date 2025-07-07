/**
 * -----------------------------------------------------------------------------
 * FILE: eventSeverityAnalytics.fn.ts (Full Filters & Advanced Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline with the
 * `$facet` operator to generate two separate datasets: one for accidents
 * *during* the specified event period, and one for accidents *outside* of it.
 * It now includes a comprehensive set of filters.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const eventSeverityAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Define Date Ranges ---
	const overallStartDate = filters.dateOfAccidentFrom
		? moment(filters.dateOfAccidentFrom).startOf("day").toDate()
		: moment().subtract(1, "year").startOf("day").toDate();
	const overallEndDate = filters.dateOfAccidentTo
		? moment(filters.dateOfAccidentTo).endOf("day").toDate()
		: moment().endOf("day").toDate();

	const eventStartDate = moment(filters.eventDateFrom).startOf("day")
		.toDate();
	const eventEndDate = moment(filters.eventDateTo).endOf("day").toDate();

	// --- 2. Build Comprehensive Base Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: overallStartDate, $lte: overallEndDate },
	};

	// --- Add all other user-selected filters ---
	if (filters.officer) {
		matchFilter.officer = { $regex: new RegExp(filters.officer, "i") };
	}
	if (filters.deadCountMin !== undefined) {
		matchFilter.dead_count = {
			...matchFilter.dead_count,
			$gte: filters.deadCountMin,
		};
	}
	if (filters.deadCountMax !== undefined) {
		matchFilter.dead_count = {
			...matchFilter.dead_count,
			$lte: filters.deadCountMax,
		};
	}
	if (filters.injuredCountMin !== undefined) {
		matchFilter.injured_count = {
			...matchFilter.injured_count,
			$gte: filters.injuredCountMin,
		};
	}
	if (filters.injuredCountMax !== undefined) {
		matchFilter.injured_count = {
			...matchFilter.injured_count,
			$lte: filters.injuredCountMax,
		};
	}

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
		roadSurfaceConditions: "road_surface_conditions.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key]?.length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}

	const vehicleElemMatch: Document = {};
	if (filters.vehicleSystem && filters.vehicleSystem.length > 0) {
		vehicleElemMatch["system.name"] = { $in: filters.vehicleSystem };
	}
	if (filters.driverSex && filters.driverSex.length > 0) {
		vehicleElemMatch["driver.sex.name"] = { $in: filters.driverSex };
	}
	if (filters.driverLicenceType && filters.driverLicenceType.length > 0) {
		vehicleElemMatch["driver.licence_type.name"] = {
			$in: filters.driverLicenceType,
		};
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
	}

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$facet: {
				// --- Part 1: Data for accidents WITHIN the event period ---
				eventData: [
					{
						$match: {
							date_of_accident: {
								$gte: eventStartDate,
								$lte: eventEndDate,
							},
						},
					},
					{ $group: { _id: "$type.name", count: { $sum: 1 } } },
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
				// --- Part 2: Data for accidents OUTSIDE the event period ---
				nonEventData: [
					{
						$match: {
							date_of_accident: {
								$not: {
									$gte: eventStartDate,
									$lte: eventEndDate,
								},
							},
						},
					},
					{ $group: { _id: "$type.name", count: { $sum: 1 } } },
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
			},
		},
	];

	const results = await accident.aggregation({ pipeline }).toArray();
	const analyticsData = results[0] || { eventData: [], nonEventData: [] };

	// --- 4. Helper function to ensure all severity types are present ---
	const formatSeverityData = (data: { name: string; count: number }[]) => {
		const severities = ["فوتی", "جرحی", "خسارتی"];
		const dataMap = new Map(data.map((item) => [item.name, item.count]));
		return severities.map((sev) => ({
			name: sev,
			count: dataMap.get(sev) || 0,
		}));
	};

	// --- 5. Format and Return the Final Payload ---
	return {
		analytics: {
			eventData: formatSeverityData(analyticsData.eventData),
			nonEventData: formatSeverityData(analyticsData.nonEventData),
		},
	};
};
