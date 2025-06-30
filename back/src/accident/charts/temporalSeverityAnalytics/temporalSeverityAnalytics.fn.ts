/**
 * -----------------------------------------------------------------------------
 * FILE: temporalSeverityAnalytics.fn.ts (Full Filters & Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline to calculate
 * the share of fatal accidents from severe accidents for each month.
 *
 * It works by:
 * 1.  Setting a default time range to the last 3 years.
 * 2.  Applying all user-selected filters.
 * 3.  Grouping documents by year and month, and conditionally summing the counts
 * for "فوتی" and "جرحی" accidents.
 * 4.  Calculating the percentage ratio in a subsequent projection stage.
 * 5.  Post-processing the results to create a continuous time-series.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const temporalSeverityAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const startYear = now.jYear() - 3;
		startDate = moment(`${startYear}/01/01`, "jYYYY/jMM/jDD").startOf(
			"day",
		);
		endDate = moment().endOf("day");
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day");
		endDate = moment(filters.dateOfAccidentTo).endOf("day");
	}

	// --- 2. Build Comprehensive Base Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate.toDate(), $lte: endDate.toDate() },
		// IMPORTANT: The analysis is only on "Severe Accidents"
		"type.name": { $in: ["فوتی", "جرحی"] },
	};

	// --- Add all other user-selected filters ---
	const arrayFilters: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		road: "road.name",
		lightStatus: "light_status.name",
		collisionType: "collision_type.name",
		roadSituation: "road_situation.name",
		roadSurfaceConditions: "road_surface_conditions.name",
		humanReasons: "human_reasons.name",
		roadDefects: "road_defects.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key].length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}
	// ... Add other filter logic as needed ...

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		{ $match: matchFilter },
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
				fatalCount: {
					$sum: { $cond: [{ $eq: ["$type.name", "فوتی"] }, 1, 0] },
				},
				injuryCount: {
					$sum: { $cond: [{ $eq: ["$type.name", "جرحی"] }, 1, 0] },
				},
			},
		},
		{
			$project: {
				_id: 1,
				ratio: {
					$cond: {
						if: {
							$gt: [{ $add: ["$fatalCount", "$injuryCount"] }, 0],
						},
						then: {
							$multiply: [
								{
									$divide: ["$fatalCount", {
										$add: ["$fatalCount", "$injuryCount"],
									}],
								},
								100,
							],
						},
						else: 0, // Avoid division by zero
					},
				},
			},
		},
		{ $sort: { "_id.year": 1, "_id.month": 1 } },
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// --- 4. Post-process to create a continuous time series ---
	const resultsMap = new Map<string, number>();
	dbResults.forEach((result) => {
		const key = `${result._id.year}-${
			String(result._id.month).padStart(2, "0")
		}`;
		resultsMap.set(key, result.ratio);
	});

	const categories: string[] = [];
	const seriesData: number[] = [];
	const current = startDate.clone();

	while (current.isBefore(endDate) || current.isSame(endDate, "month")) {
		const jalaliDate = moment(current.toDate()).locale("fa");
		const year = jalaliDate.jYear();
		const month = jalaliDate.jMonth() + 1;
		const key = `${current.year()}-${
			String(current.month() + 1).padStart(2, "0")
		}`;

		categories.push(`${year}-${String(month).padStart(2, "0")}`);
		seriesData.push(resultsMap.get(key) || 0);

		current.add(1, "month");
	}

	// --- 5. Format and Return the Final Payload ---
	return {
		analytics: {
			categories: categories,
			series: [
				{
					name: "سهم تصادفات فوتی از شدید",
					data: seriesData,
				},
			],
		},
	};
};
