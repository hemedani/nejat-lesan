/**
 * -----------------------------------------------------------------------------
 * FILE: spatialLightAnalytics.fn.ts (Corrected Logic)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline with the
 * `$facet` operator. It now correctly separates the main filter from the
 * conditional counting logic to calculate the map ratio accurately.
 */
import type { ActFn, Document } from "@deps";
import { accident, coreApp } from "../../../../mod.ts";
import moment from "npm:jalali-moment";
import { MyContext } from "@lib";

export const spatialLightAnalyticsFn: ActFn = async (body) => {
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { set: filters } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const lastYear = now.jYear() - 1;
		startDate = moment(`${lastYear}/01/01`, "jYYYY/jMM/jDD").startOf("day")
			.toDate();
		endDate = moment().endOf("day").toDate();
	} else {
		startDate = moment(filters.dateOfAccidentFrom).startOf("day").toDate();
		endDate = moment(filters.dateOfAccidentTo).endOf("day").toDate();
	}

	// --- 2. Build Comprehensive Base Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate, $lte: endDate },
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

	// IMPORTANT: We separate the lightStatus filter from the main array filters
	const { lightStatus, ...otherArrayFilters } = filters;

	const arrayFilterMappings: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		road: "road.name",
		trafficZone: "traffic_zone.name",
		cityZone: "city_zone.name",
		accidentType: "type.name",
		position: "position.name",
		rulingType: "ruling_type.name",
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

	for (const key in otherArrayFilters) {
		if (otherArrayFilters[key] && otherArrayFilters[key]?.length > 0) {
			matchFilter[arrayFilterMappings[key]] = {
				$in: otherArrayFilters[key],
			};
		}
	}

	// Default city for this chart is "اهواز"
	if (!matchFilter["city.name"]) {
		matchFilter["city.name"] = user.settings?.city.name || "اهواز";
	}

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const lightStatusToAnalyze = (lightStatus && lightStatus.length > 0)
		? lightStatus
		: ["روز"];

	const pipeline: Document[] = [
		{ $match: matchFilter },
		{ $match: { "city_zone.name": { $exists: true, $ne: null } } },
		{
			$facet: {
				// --- Part 1: Data for the Stacked Bar Chart ---
				barChartData: [
					// Apply the lightStatus filter only for the bar chart data
					{
						$match: {
							"light_status.name": { $in: lightStatusToAnalyze },
						},
					},
					{
						$group: {
							_id: {
								location: "$city_zone.name",
								lightStatus: "$light_status.name",
							},
							count: { $sum: 1 },
						},
					},
					{
						$group: {
							_id: "$_id.location",
							counts: {
								$push: { k: "$_id.lightStatus", v: "$count" },
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
				// --- Part 2: Data for the Zonal Map ---
				mapData: [
					{
						$group: {
							_id: "$city_zone.name",
							totalCount: { $sum: 1 },
							selectedLightStatusCount: {
								$sum: {
									$cond: [
										{
											$in: [
												"$light_status.name",
												lightStatusToAnalyze,
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
												"$selectedLightStatusCount",
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
	const analyticsData = results[0] || { barChartData: [], mapData: [] };

	// --- 4. Format Bar Chart Data for Frontend ---
	const categories = analyticsData.barChartData.map((item: any) => item.name);
	const allLightStatusTypes = [
		"روز",
		"طلوع",
		"غروب",
		"شب با روشنایی کافی",
		"شب با نور ناکافی",
	];
	const series = allLightStatusTypes.map((status) => ({
		name: status,
		data: categories.map((cat: string) =>
			analyticsData.barChartData.find((d: any) => d.name === cat)
				?.counts[status] || 0
		),
	}));

	// --- 5. Format and Return the Final Payload ---
	return {
		analytics: {
			barChart: {
				categories: categories,
				series: series,
			},
			mapChart: analyticsData.mapData,
		},
	};
};
