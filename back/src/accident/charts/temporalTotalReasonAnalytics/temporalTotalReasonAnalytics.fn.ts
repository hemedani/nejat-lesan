/**
 * -----------------------------------------------------------------------------
 * FILE: temporalTotalReasonAnalytics.fn.ts (Full Filters & Advanced Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, advanced MongoDB Aggregation Pipeline to first
 * identify the top 10 ultimate causes within the filtered data, and then
 * calculates a monthly time-series count for each of those top 10 causes.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const temporalTotalReasonAnalyticsFn: ActFn = async (body) => {
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
	if (filters.officer) {
		matchFilter.officer = { $regex: new RegExp(filters.officer, "i") };
	}
	// ... Add all other direct match and range filters ...

	const arrayFilters: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		road: "road.name",
		accidentType: "type.name",
		position: "position.name",
		lightStatus: "light_status.name",
		collisionType: "collision_type.name",
		roadSituation: "road_situation.name",
		roadSurfaceConditions: "road_surface_conditions.name",
		areaUsages: "area_usages.name",
		roadDefects: "road_defects.name",
		humanReasons: "human_reasons.name",
		vehicleReasons: "vehicle_reasons.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key]?.length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}

	// ... Add $elemMatch for vehicle/driver properties ...

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		// Stage 1: Filter accidents based on user criteria.
		{ $match: matchFilter },
		// Stage 2: De-normalize by vehicle to analyze each driver.
		{ $unwind: "$vehicle_dtos" },
		// Stage 3: Filter out records without a valid ultimate cause.
		{
			$match: {
				"vehicle_dtos.driver.total_reason.name": {
					$exists: true,
					$ne: null,
				},
			},
		},
		// Stage 4: Group by both reason and month to get monthly counts for each reason.
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
		// Stage 5: Re-group by just the reason to collect all monthly data and get a total count.
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
		// Stage 6: Sort by the total count to find the most frequent reasons.
		{ $sort: { totalCount: -1 } },
		// Stage 7: Limit to the top 10 reasons.
		{ $limit: 10 },
	];

	const dbResults = await accident.aggregation({ pipeline }).toArray();

	// --- 4. Post-process to create a continuous time series for the top 10 reasons ---
	const categories: string[] = [];
	const current = startDate.clone();
	while (current.isBefore(endDate) || current.isSame(endDate, "month")) {
		const jalaliDate = moment(current.toDate()).locale("fa");
		const year = jalaliDate.jYear();
		const month = jalaliDate.jMonth() + 1;
		categories.push(`${year}-${String(month).padStart(2, "0")}`);
		current.add(1, "month");
	}

	const series = dbResults.map((reasonDoc) => {
		const monthlyMap = new Map<string, number>();
		reasonDoc.monthlyData.forEach((monthData: any) => {
			const key = `${monthData.year}-${
				String(monthData.month).padStart(2, "0")
			}`;
			monthlyMap.set(key, monthData.count);
		});

		const data = categories.map((category) => {
			const [jYear, jMonth] = category.split("-").map(Number);
			const gDate = moment(`${jYear}/${jMonth}/01`, "jYYYY/jMM/jDD");
			const key = `${gDate.year()}-${
				String(gDate.month() + 1).padStart(2, "0")
			}`;
			return monthlyMap.get(key) || 0;
		});

		return {
			name: reasonDoc._id,
			data: data,
		};
	});

	// --- 5. Format and Return the Final Payload ---
	return {
		analytics: {
			categories: categories,
			series: series,
		},
	};
};
