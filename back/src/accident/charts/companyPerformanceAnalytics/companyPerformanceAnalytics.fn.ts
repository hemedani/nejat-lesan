/**
 * -----------------------------------------------------------------------------
 * FILE: companyPerformanceAnalytics.fn.ts (Advanced Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline to generate
 * all the data for the manufacturer comparison bubble chart. It strictly filters
 * for severe accidents, groups by company, and calculates all required metrics
 * and distributions in one go.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const companyPerformanceAnalyticsFn: ActFn = async (body) => {
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
		"type.name": { $in: ["فوتی", "جرحی"] }, // Hardcoded filter for Severe Accidents
	};

	// Add other filters to matchFilter...
	if (filters.province && filters.province.length > 0) {
		matchFilter["province.name"] = { $in: filters.province };
	}
	// ... add more filter logic here ...

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		// Stage 1: Filter accidents based on all criteria.
		{ $match: matchFilter },
		// Stage 2: De-normalize by vehicle to analyze each car individually.
		{ $unwind: "$vehicle_dtos" },
		// Stage 3: Group by the company name.
		{
			$group: {
				_id: "$vehicle_dtos.system.name", // Assuming system.name is the company.
				// Count total severe accidents for this company
				totalSevereCount: { $sum: 1 },
				// Count fatal accidents for this company
				fatalCount: {
					$sum: { $cond: [{ $eq: ["$type.name", "فوتی"] }, 1, 0] },
				},
				// Count accidents with an effective vehicle reason
				withVehicleReasonCount: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $isArray: "$vehicle_reasons" },
									{ $gt: [{ $size: "$vehicle_reasons" }, 0] },
									{
										$ne: [{
											$first: "$vehicle_reasons.name",
										}, "ندارد"],
									},
								],
							},
							1,
							0,
						],
					},
				},
				// Push all production years into an array for later bucketing.
				// NOTE: Assumes 'productionYear' field exists on vehicle_dtos.
				productionYears: { $push: "$vehicle_dtos.productionYear" },
			},
		},
		// Stage 4: Calculate final metrics and format the output.
		{
			$project: {
				_id: 0,
				companyName: "$_id",
				// X-Axis: Share of vehicles with a vehicle factor
				xAxis: {
					$multiply: [{
						$divide: [
							"$withVehicleReasonCount",
							"$totalSevereCount",
						],
					}, 100],
				},
				// Y-Axis: Share of fatal accidents among severe ones
				yAxis: {
					$multiply: [{
						$divide: ["$fatalCount", "$totalSevereCount"],
					}, 100],
				},
				// Z-Axis (Bubble Size): Total count of severe accidents
				bubbleSize: "$totalSevereCount",
				// Calculate the distribution for the hover-over pie chart
				yearDistribution: {
					$let: {
						vars: {
							years: "$productionYears",
						},
						in: [
							{
								name: "قبل از ۱۳۷۰",
								count: {
									$size: {
										$filter: {
											input: "$$years",
											cond: { $lt: ["$$this", 1370] },
										},
									},
								},
							},
							{
								name: "۱۳۷۰-۱۳۸۰",
								count: {
									$size: {
										$filter: {
											input: "$$years",
											cond: {
												$and: [{
													$gte: ["$$this", 1370],
												}, { $lt: ["$$this", 1380] }],
											},
										},
									},
								},
							},
							{
								name: "۱۳۸۰-۱۳۹۰",
								count: {
									$size: {
										$filter: {
											input: "$$years",
											cond: {
												$and: [{
													$gte: ["$$this", 1380],
												}, { $lt: ["$$this", 1390] }],
											},
										},
									},
								},
							},
							{
								name: "۱۳۹۰-۱۴۰۰",
								count: {
									$size: {
										$filter: {
											input: "$$years",
											cond: {
												$and: [{
													$gte: ["$$this", 1390],
												}, { $lt: ["$$this", 1400] }],
											},
										},
									},
								},
							},
							{
								name: "بعد از ۱۴۰۰",
								count: {
									$size: {
										$filter: {
											input: "$$years",
											cond: { $gte: ["$$this", 1400] },
										},
									},
								},
							},
						],
					},
				},
			},
		},
		// Stage 5: Sort by the number of accidents to show major companies more prominently.
		{ $sort: { bubbleSize: -1 } },
		// Stage 6: Limit to a reasonable number of companies.
		{ $limit: 20 },
	];

	const analyticsData = await accident.aggregation({ pipeline }).toArray();

	// --- 4. Format and Return the Final Payload ---
	return {
		analytics: analyticsData,
	};
};
