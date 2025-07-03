/**
 * -----------------------------------------------------------------------------
 * FILE: temporalDamageAnalytics.fn.ts (Full Filters & Corrected Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline to calculate
 * the share of accidents involving user-selected damage sections for each month.
 * It now uses a default set of common damages if none are provided by the user.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const temporalDamageAnalyticsFn: ActFn = async (body) => {
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
	};

	// --- Add all other user-selected filters ---
	const arrayFilters: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		road: "road.name",
		accidentType: "type.name",
		position: "position.name",
		lightStatus: "light_status.name",
		collisionType: "collision_type.name",
		roadSituation: "road_situation.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key]?.length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}

	// --- 3. Define and Execute the Aggregation Pipeline ---
	// Define a default list of common damages to analyze if none are selected by the user.
	const defaultDamageSections = [
		"سپر جلو",
		"سپر عقب",
		"درب موتور جلو",
		"چراغ جلو راست",
		"چراغ جلو چپ",
	];

	// Determine which list of damages to use for the analysis.
	const damageSectionsToAnalyze =
		(filters.maxDamageSections && filters.maxDamageSections.length > 0)
			? filters.maxDamageSections
			: defaultDamageSections;

	const pipeline: Document[] = [
		{ $match: matchFilter },
		// Create a flattened array of all damage sections from all vehicles in an accident
		{
			$addFields: {
				all_damage_sections: {
					$reduce: {
						input: "$vehicle_dtos",
						initialValue: [],
						in: {
							$concatArrays: [
								"$$value",
								{
									$ifNull: [
										"$$this.max_damage_sections.name",
										[],
									],
								},
							],
						},
					},
				},
			},
		},
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
				totalCount: { $sum: 1 },
				// Conditionally count based on the selected (or default) damages.
				selectedTypesCount: {
					$sum: {
						$cond: {
							if: {
								$gt: [{
									$size: {
										$setIntersection: [
											"$all_damage_sections",
											damageSectionsToAnalyze,
										],
									},
								}, 0],
							},
							then: 1,
							else: 0,
						},
					},
				},
			},
		},
		{
			$project: {
				_id: 1,
				ratio: {
					$cond: {
						if: { $gt: ["$totalCount", 0] },
						then: {
							$multiply: [{
								$divide: ["$selectedTypesCount", "$totalCount"],
							}, 100],
						},
						else: 0,
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
					name: "سهم از کل تصادفات",
					data: seriesData,
				},
			],
		},
	};
};
