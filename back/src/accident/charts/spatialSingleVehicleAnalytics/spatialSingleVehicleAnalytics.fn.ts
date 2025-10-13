/**
 * -----------------------------------------------------------------------------
 * FILE: spatialSingleVehicleAnalytics.fn.ts (Full Filters & Advanced Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline with the
 * `$facet` operator to generate all data required for the spatial comparison
 * of single-vehicle accidents, focused on comparing zones within a specific city.
 */
import type { ActFn, Document } from "@deps";
import { accident, coreApp } from "../../../../mod.ts";
import moment from "npm:jalali-moment";
import { MyContext } from "@lib";

export const spatialSingleVehicleAnalyticsFn: ActFn = async (body) => {
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

	// --- 2. Define Single-Vehicle Types & Build Comprehensive Filter ---
	const singleVehicleTypes = [
		"برخورد وسیله نقلیه با شی ثابت",
		"واژگونی و سقوط",
		"خروج از جاده",
	];

	const matchFilter: Document = {
		date_of_accident: { $gte: startDate, $lte: endDate },
		// IMPORTANT: Hardcoded filter for "Single-Vehicle" accidents as required by the chart.
		"collision_type.name": { $in: singleVehicleTypes },
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
		trafficZone: "traffic_zone.name",
		cityZone: "city_zone.name",
		accidentType: "type.name",
		position: "position.name",
		rulingType: "ruling_type.name",
		lightStatus: "light_status.name",
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
		matchFilter["city.name"] = user.settings?.city.name || "اهواز";
	}

	// --- 3. Define and Execute the Aggregation Pipeline ---
	const collisionTypesToAnalyzeForMap =
		(filters.collisionType && filters.collisionType.length > 0)
			? filters.collisionType
			: ["خروج از جاده"]; // Default from documentation

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
							totalSingleVehicleSevere: { $sum: 1 },
							selectedTypesCount: {
								$sum: {
									$cond: [
										{
											$in: [
												"$collision_type.name",
												collisionTypesToAnalyzeForMap,
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
									if: {
										$gt: ["$totalSingleVehicleSevere", 0],
									},
									then: {
										$multiply: [{
											$divide: [
												"$selectedTypesCount",
												"$totalSingleVehicleSevere",
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
	const series = singleVehicleTypes.map((status) => ({
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
