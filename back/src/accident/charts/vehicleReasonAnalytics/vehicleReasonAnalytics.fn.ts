/**
 * -----------------------------------------------------------------------------
 * FILE: vehicleReasonAnalytics.fn.ts (Corrected & Optimized)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline with the
 * `$facet` operator to generate data for both the pie and stacked bar charts.
 * It strictly filters for severe accidents ("فوتی" and "جرحی") as required and
 * now correctly references the top-level `vehicle_reasons` field.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const vehicleReasonAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const lastYear = now.jYear() - 1;
		startDate = moment(`${lastYear}/01/01`, "jYYYY/jMM/jDD").startOf("day")
			.toDate();
		endDate = moment(`${lastYear}/12/01`, "jYYYY/jMM/jDD").endOf("jMonth")
			.endOf("day").toDate();
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day").toDate();
		endDate = moment(filters.dateOfAccidentTo).endOf("day").toDate();
	}

	// --- 2. Build Comprehensive Base Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate, $lte: endDate },
		// IMPORTANT: Hardcoded filter for "Severe Accidents" as required by the document.
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

	// --- Handle complex vehicle/driver filters with $elemMatch ---
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
		// Stage 1: Filter accidents based on all criteria.
		{ $match: matchFilter },

		// Stage 2: Use $facet to run parallel aggregations.
		{
			$facet: {
				// --- Part 1: Pie chart data (With vs. Without Vehicle Reason) ---
				pieChartData: [
					{
						$group: {
							_id: {
								$cond: {
									if: {
										$and: [
											{ $isArray: "$vehicle_reasons" },
											{
												$gt: [{
													$size: "$vehicle_reasons",
												}, 0],
											},
											{
												$ne: [{
													$first:
														"$vehicle_reasons.name",
												}, "ندارد"],
											},
										],
									},
									then: "دارای عامل", // With Factor
									else: "فاقد عامل", // Without Factor
								},
							},
							count: { $sum: 1 },
						},
					},
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],

				// --- Part 2: Stacked bar chart data (Top reasons by severity) ---
				barChartData: [
					// De-normalize the nested vehicle_reasons array.
					{ $unwind: "$vehicle_reasons" },
					// Exclude the "ندارد" reason.
					{ $match: { "vehicle_reasons.name": { $ne: "ندارد" } } },
					// Group by both the reason name and the accident severity.
					{
						$group: {
							_id: {
								reason: "$vehicle_reasons.name",
								severity: "$type.name",
							},
							count: { $sum: 1 },
						},
					},
					// Re-group by reason name to structure data for stacking.
					{
						$group: {
							_id: "$_id.reason",
							severityCounts: {
								$push: {
									severity: "$_id.severity",
									count: "$count",
								},
							},
							total: { $sum: "$count" },
						},
					},
					// Sort by the total count to find the most frequent reasons.
					{ $sort: { total: -1 } },
					// Limit to the top results for a clean chart.
					{ $limit: 10 },
					// Project into a clean format.
					{
						$project: {
							_id: 0,
							name: "$_id",
							counts: "$severityCounts",
						},
					},
				],
			},
		},
	];

	const results = await accident.aggregation({ pipeline }).toArray();
	const analyticsData = results[0] || { pieChartData: [], barChartData: [] };

	// --- 4. Format Bar Chart Data for Frontend ---
	const categories = analyticsData.barChartData.map((item: any) => item.name);
	const fatalData = categories.map((cat: string) => {
		const reasonData = analyticsData.barChartData.find((d: any) =>
			d.name === cat
		);
		const severityData = reasonData?.counts.find((s: any) =>
			s.severity === "فوتی"
		);
		return severityData?.count || 0;
	});
	const injuryData = categories.map((cat: string) => {
		const reasonData = analyticsData.barChartData.find((d: any) =>
			d.name === cat
		);
		const severityData = reasonData?.counts.find((s: any) =>
			s.severity === "جرحی"
		);
		return severityData?.count || 0;
	});

	// --- 5. Return Final Payload ---
	return {
		analytics: {
			pieChart: analyticsData.pieChartData,
			barChart: {
				categories: categories,
				series: [
					{ name: "فوتی", data: fatalData },
					{ name: "جرحی", data: injuryData },
				],
			},
		},
	};
};
