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
import { accident, event } from "../../../../mod.ts";
import moment from "npm:jalali-moment";
import { ObjectId } from "@deps";

export const eventSeverityAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Get event details if eventId is provided ---
	let eventDateRanges: string[][] = [];
	if (filters.eventId) {
		const eventDoc = await event.findOne({
			filters: { _id: new ObjectId(filters.eventId) },
			projection: { dates: 1 },
		});

		if (eventDoc && eventDoc.dates && Array.isArray(eventDoc.dates)) {
			eventDateRanges = eventDoc.dates;
		}
	}

	// --- 2. Define Date Ranges ---
	const overallStartDate = filters.dateOfAccidentFrom
		? moment(filters.dateOfAccidentFrom).startOf("day").toDate()
		: moment().subtract(1, "year").startOf("day").toDate();
	const overallEndDate = filters.dateOfAccidentTo
		? moment(filters.dateOfAccidentTo).endOf("day").toDate()
		: moment().endOf("day").toDate();

	// --- 3. Build Comprehensive Base Filter ---
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

	// --- 4. Define event date filters based on the event data ---
	let eventDateFilter: Document = {};

	if (eventDateRanges.length > 0) {
		// Create an OR condition for all date ranges in the event
		const dateConditions = eventDateRanges.map(([startDate, endDate]) => ({
			date_of_accident: {
				$gte: moment(startDate).startOf("day").toDate(),
				$lte: moment(endDate).endOf("day").toDate(),
			},
		}));

		if (dateConditions.length === 1) {
			eventDateFilter = dateConditions[0];
		} else {
			eventDateFilter = { $or: dateConditions };
		}
	} else if (filters.dateOfAccidentFrom && filters.dateOfAccidentTo) {
		// Fallback to the original overall date range if no event is specified
		eventDateFilter = {
			date_of_accident: {
				$gte: overallStartDate,
				$lte: overallEndDate,
			},
		};
	} else {
		// If no specific event and no date range, use a default range
		eventDateFilter = {
			date_of_accident: {
				$gte: overallStartDate,
				$lte: overallEndDate,
			},
		};
	}

	// --- 5. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$facet: {
				// --- Part 1: Data for accidents WITHIN the event period ---
				eventData: [
					{
						$match: eventDateFilter,
					},
					{ $group: { _id: "$type.name", count: { $sum: 1 } } },
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
				// --- Part 2: Data for accidents OUTSIDE the event period ---
				nonEventData: [
					{
						$match: {
							$and: [
								{ $not: eventDateFilter }, // Exclude the event dates
								{
									date_of_accident: {
										$gte: overallStartDate,
										$lte: overallEndDate,
									},
								}, // But within overall range
							],
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

	// --- 6. Helper function to ensure all severity types are present ---
	const formatSeverityData = (data: { name: string; count: number }[]) => {
		const severities = ["فوتی", "جرحی", "خسارتی"];
		const dataMap = new Map(data.map((item) => [item.name, item.count]));
		return severities.map((sev) => ({
			name: sev,
			count: dataMap.get(sev) || 0,
		}));
	};

	// --- 7. Format and Return the Final Payload ---
	return {
		analytics: {
			eventData: formatSeverityData(analyticsData.eventData),
			nonEventData: formatSeverityData(analyticsData.nonEventData),
		},
	};
};
