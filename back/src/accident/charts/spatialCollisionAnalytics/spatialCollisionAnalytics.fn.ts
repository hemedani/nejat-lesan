/**
 * -----------------------------------------------------------------------------
 * FILE: spatialCollisionAnalytics.fn.ts (Full Filters & Advanced Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline with the
 * `$facet` operator to generate all data required for the spatial comparison
 * of collision types, focused on comparing zones within a specific city.
 */
import type { ActFn, Document } from "@deps";
import { accident, collision_type } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const spatialCollisionAnalyticsFn: ActFn = async (body) => {
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

	// Default city for this chart is "اهواز"
	if (!matchFilter["city.name"]) {
		matchFilter["city.name"] = "اهواز";
	}

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const collisionTypesToAnalyze =
		(filters.collisionType && filters.collisionType.length > 0)
			? filters.collisionType
			: ["برخورد وسیله نقلیه با یک وسیله نقلیه"]; // Default from documentation

	const pipeline: Document[] = [
		{ $match: matchFilter },
		{ $match: { "city_zone.name": { $exists: true, $ne: null } } },
		{
			$facet: {
				// --- Part 1: Data for the Stacked Bar Chart ---
				barChartData: [
					{
						$group: {
							_id: {
								location: "$city_zone.name",
								collisionType: "$collision_type.name",
							},
							count: { $sum: 1 },
						},
					},
					{
						$group: {
							_id: "$_id.location",
							counts: {
								$push: { k: "$_id.collisionType", v: "$count" },
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
					{ $match: { "type.name": { $in: ["فوتی", "جرحی"] } } },
					{
						$group: {
							_id: "$city_zone.name",
							severeCount: { $sum: 1 },
							selectedCollisionTypeCount: {
								$sum: {
									$cond: [
										{
											$in: [
												"$collision_type.name",
												collisionTypesToAnalyze,
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
									if: { $gt: ["$severeCount", 0] },
									then: {
										$multiply: [{
											$divide: [
												"$selectedCollisionTypeCount",
												"$severeCount",
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
	const allCollisionTypes =
		(await collision_type.find({ filters: {}, projection: { name: 1 } })
			.toArray()).map((ct) => ct.name);
	const categories = analyticsData.barChartData.map((item: any) => item.name);
	const series = allCollisionTypes.map((status) => ({
		name: status,
		data: categories.map((cat: string) =>
			analyticsData.barChartData.find((d: any) => d.name === cat)
				?.counts[status] || 0
		),
	})).filter((s) => s.data.some((d) => d > 0)); // Only include series with data

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
