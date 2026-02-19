/**
 * -----------------------------------------------------------------------------
 * FILE: eventCollisionAnalytics.fn.ts
 * -----------------------------------------------------------------------------
 *
 * DESCRIPTION:
 * This function performs event-based collision type analytics on traffic accidents,
 * comparing collision type distributions during specific event periods
 * versus non-event periods.
 *
 * The function analyzes accident data across two distinct periods:
 * 1. Event Period: Defined by one or multiple date ranges from an event document
 * 2. Non-Event Period: All other dates within the overall analysis range
 *
 * It provides percentage share breakdowns of collision types for both periods,
 * focusing on the selected (or default) collision types.
 *
 * The analytics support comprehensive filtering capabilities including:
 * - Geographic filters (province, city, road, traffic zone, city zone)
 * - Temporal filters (date ranges)
 * - Accident type filters (accident type, position, ruling type)
 * - Environmental conditions (light status, collision type, road situation)
 * - Vehicle and driver related filters (system, driver sex, licence type)
 * - Road conditions (road defects, air status, road surface conditions)
 *
 * INPUT PARAMETERS:
 * - eventId: Optional ID of an event document with multiple date ranges
 * - dateOfAccidentFrom/to: Standard date range when no eventId is provided
 * - collisionType: Optional array of collision type names to analyze
 * - Various optional filters (officer, dead_count range, injured_count range)
 * - Geographic filters (province, city, road names)
 * - Vehicle-related filters (system, driver sex, driver licence type)
 * - Road and environmental condition filters
 *
 * EXAMPLE USAGE SCENARIOS:
 *
 * Example 1: Festival Analysis
 * An event spans multiple periods like Nowruz holidays:
 * - March 21-25, April 2-5, April 18-20
 * The function will compare collision type shares during these specific periods
 * versus other times within the overall date range.
 *
 * Example 2: Road Construction Analysis
 * A road construction project spans multiple phases:
 * - Phase 1: Jan 1-15, Mar 10-25, May 5-10
 * This allows tracking how collision patterns change during construction.
 *
 * Example 3: Weather Event Analysis
 * A weather-related event affecting traffic during specific periods:
 * - Dec 15-20 (snow period), Jan 5-8 (ice period), Jan 25-28 (post-thaw)
 *
 * Example 4: Combined Scenario with Filters
 * Filter for "Tehran" province, "Brake Defect" road defects
 * Event ID: "64a7b1c2d3e4f56789012345"
 * Event dates: [
 *    {
 *      "from": "2023-04-01",
 *      "to": "2023-04-05",
 *      "startEntireRange": "2023-04-01",
 *      "endEntireRange": "2024-01-15"
 *    },
 *    {
 *      "from": "2023-07-10",
 *      "to": "2023-07-15",
 *      "startEntireRange": "2023-04-01",
 *      "endEntireRange": "2024-01-15"
 *    },
 *    {
 *      "from": "2023-09-20",
 *      "to": "2023-09-25",
 *      "startEntireRange": "2023-04-01",
 *      "endEntireRange": "2024-01-15"
 *    },
 *    {
 *      "from": "2024-01-10",
 *      "to": "2024-01-15",
 *      "startEntireRange": "2023-04-01",
 *      "endEntireRange": "2024-01-15"
 *    }
 *  ]
 *
 * In this example, the function will:
 * - Calculate overall date range from 2023-04-01 to 2024-01-15 (based on startEntireRange to endEntireRange)
 * - Analyze accidents in Tehran during specific event periods: April 1-5, July 10-15, Sep 20-25, Jan 10-15
 * - Compare against other dates between April 2023 - January 2024 (May-June, Aug-Dec 2023, Jan 1-9 2024)
 * - Only include accidents where road defects include "Brake Defect"
 *
 * This ensures that data from May, June, August through December 2023, and January 1-9 2024 are properly
 * considered as 'non-event' data, even though they fall within the overall analysis range.
 *
 * AGGREGATION LOGIC:
 * 1. Fetches event document if eventId is provided to extract date ranges
 * 2. Calculates overall date range from min(start dates) to max(end dates)
 * 3. Creates two parallel data streams using $facet:
 *    - eventData: Accidents occurring in any of the event date ranges
 *    - nonEventData: Accidents occurring outside event ranges but within overall range
 * 4. Groups results by collision type for both streams
 * 5. Calculates percentage share of each collision type within its stream
 * 6. Filters output to only include the selected (or default) collision types
 *
 * OUTPUT FORMAT:
 * {
 *   analytics: {
 *     eventData: [
 *       { name: "برخورد وسیله نقلیه با شیء ثابت", share: 22.5 },
 *       { name: "واژگونی و سقوط", share: 18.3 },
 *       { name: "خروج از جاده", share: 15.7 },
 *       { name: "برخورد وسیله نقلیه با یک وسیله نقلیه", share: 43.5 }
 *     ],
 *     nonEventData: [
 *       { name: "برخورد وسیله نقلیه با شیء ثابت", share: 19.1 },
 *       { name: "واژگونی و سقوط", share: 14.6 },
 *       { name: "خروج از جاده", share: 12.0 },
 *       { name: "برخورد وسیله نقلیه با یک وسیله نقلیه", share: 54.3 }
 *     ]
 *   }
 * }
 */
import type { ActFn, Document } from "@deps";
import { accident, event } from "../../../../mod.ts";
import moment from "npm:jalali-moment";
import { ObjectId } from "@deps";

export const eventCollisionAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Get event details if eventId is provided ---
	let eventDateRanges: { from: string; to: string }[] = [];
	let overallStartDate: Date = moment("1970-01-01").startOf("day").toDate();
	let overallEndDate: Date = moment().endOf("day").toDate();

	if (filters.eventId) {
		const eventDoc = await event.findOne({
			filters: { _id: new ObjectId(filters.eventId as string) },
			projection: { dates: 1 },
		});

		if (eventDoc && eventDoc.dates && Array.isArray(eventDoc.dates)) {
			// Extract from/to pairs for eventDateRanges
			eventDateRanges = eventDoc.dates.map(
				(dateObj: { from: string; to: string }) => ({
					from: dateObj.from,
					to: dateObj.to,
				}),
			);

			// Calculate overall date range based on all date ranges in the event
			if (eventDoc.dates.length > 0) {
				// Find the minimum from and maximum to across all ranges
				const startDates = eventDoc.dates.map((date) =>
					moment(date.from).startOf("day").toDate()
				);
				const endDates = eventDoc.dates.map((date) =>
					moment(date.to).endOf("day").toDate()
				);

				overallStartDate = new Date(
					Math.min(...startDates.map((date) => date.getTime())),
				);
				overallEndDate = new Date(
					Math.max(...endDates.map((date) => date.getTime())),
				);
			}
		}
	} else {
		// Use the original filter if no eventId is provided
		overallStartDate = filters.dateOfAccidentFrom
			? moment(filters.dateOfAccidentFrom).startOf("day").toDate()
			: moment("1970-01-01").startOf("day").toDate();
		overallEndDate = filters.dateOfAccidentTo
			? moment(filters.dateOfAccidentTo).endOf("day").toDate()
			: moment().endOf("day").toDate();
	}

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

	// --- 3. Define Default Collision Types & Determine Which to Analyze ---
	const defaultCollisionTypes = [
		"برخورد وسیله نقلیه با شیء ثابت",
		"واژگونی و سقوط",
		"خروج از جاده",
		"برخورد وسیله نقلیه با یک وسیله نقلیه",
	];

	const collisionTypesToAnalyze: string[] =
		(filters.collisionType && filters.collisionType.length > 0)
			? (filters.collisionType as string[])
			: defaultCollisionTypes;

	// --- 4. Define event date filters based on the event data ---
	let eventDateFilter: Document = {};

	if (eventDateRanges.length > 0) {
		// Create an OR condition for all date ranges in the event
		const dateConditions = eventDateRanges.map((dateRange) => ({
			date_of_accident: {
				$gte: moment(dateRange.from).startOf("day").toDate(),
				$lte: moment(dateRange.to).endOf("day").toDate(),
			},
		}));

		if (dateConditions.length === 1) {
			eventDateFilter = dateConditions[0];
		} else {
			eventDateFilter = { $or: dateConditions };
		}
	} else {
		// Fallback to the overall date range if no event is specified
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
					{
						$group: {
							_id: "$collision_type.name",
							count: { $sum: 1 },
						},
					},
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
				// --- Part 2: Data for accidents OUTSIDE the event period ---
				nonEventData: [
					{
						$match: {
							$and: [
								...(eventDateRanges.length > 0
									? [{
										$expr: {
											$not: {
												$or: eventDateRanges.map((
													dateRange,
												) => ({
													$and: [
														{
															$gte: [
																"$date_of_accident",
																moment(
																	dateRange
																		.from,
																).startOf("day")
																	.toDate(),
															],
														},
														{
															$lte: [
																"$date_of_accident",
																moment(
																	dateRange
																		.to,
																)
																	.endOf(
																		"day",
																	).toDate(),
															],
														},
													],
												})),
											},
										},
									}]
									: []),
								{
									date_of_accident: {
										$gte: overallStartDate,
										$lte: overallEndDate,
									},
								}, // But within overall range
							],
						},
					},
					{
						$group: {
							_id: "$collision_type.name",
							count: { $sum: 1 },
						},
					},
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
			},
		},
	];

	const results = await accident.aggregation({ pipeline }).toArray();
	const analyticsData = results[0] || { eventData: [], nonEventData: [] };

	// --- 6. Helper function to calculate percentage share ---
	const calculateShare = (data: { name: string; count: number }[]) => {
		const total = data.reduce((sum, item) => sum + item.count, 0);
		if (total === 0) {
			return collisionTypesToAnalyze.map((name) => ({ name, share: 0 }));
		}

		return collisionTypesToAnalyze.map((typeName) => {
			const found = data.find((item) => item.name === typeName);
			const count = found ? found.count : 0;
			return {
				name: typeName,
				share: total > 0 ? (count / total) * 100 : 0,
			};
		});
	};

	// --- 7. Format and Return the Final Payload ---
	return {
		analytics: {
			eventData: calculateShare(analyticsData.eventData),
			nonEventData: calculateShare(analyticsData.nonEventData),
		},
	};
};
