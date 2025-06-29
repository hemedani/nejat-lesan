/**
 * -----------------------------------------------------------------------------
 * FILE: collisionAnalytics.fn.ts (Full Filters & Corrected Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, powerful MongoDB Aggregation Pipeline with the
 * `$facet` operator to generate all the data needed for the multi-part
 * collision dashboard. It now includes comprehensive filtering logic.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const collisionAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom && !filters.dateOfAccidentTo) {
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

	// --- 2. Build Comprehensive Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: startDate, $lte: endDate },
	};

	// --- Add all other filters to the matchFilter object ---
	if (filters.province && filters.province.length > 0) {
		matchFilter["province.name"] = { $in: filters.province };
	}
	if (filters.city && filters.city.length > 0) {
		matchFilter["city.name"] = { $in: filters.city };
	}
	if (filters.road && filters.road.length > 0) {
		matchFilter["road.name"] = { $in: filters.road };
	}
	if (filters.accidentType && filters.accidentType.length > 0) {
		matchFilter["type.name"] = { $in: filters.accidentType };
	}
	if (filters.position && filters.position.length > 0) {
		matchFilter["position.name"] = { $in: filters.position };
	}
	if (filters.lightStatus && filters.lightStatus.length > 0) {
		matchFilter["light_status.name"] = { $in: filters.lightStatus };
	}
	if (filters.collisionType && filters.collisionType.length > 0) {
		matchFilter["collision_type.name"] = { $in: filters.collisionType };
	}
	if (filters.roadSituation && filters.roadSituation.length > 0) {
		matchFilter["road_situation.name"] = { $in: filters.roadSituation };
	}
	if (
		filters.roadSurfaceConditions &&
		filters.roadSurfaceConditions.length > 0
	) {
		matchFilter["road_surface_conditions.name"] = {
			$in: filters.roadSurfaceConditions,
		};
	}

	// ... Add more direct filters here ...

	// --- Handle complex vehicle/driver filters with $elemMatch ---
	const vehicleElemMatch: Document = {};
	if (filters.vehicleSystem && filters.vehicleSystem.length > 0) {
		vehicleElemMatch["system.name"] = { $in: filters.vehicleSystem };
	}
	if (filters.vehicleFaultStatus && filters.vehicleFaultStatus.length > 0) {
		vehicleElemMatch["fault_status.name"] = {
			$in: filters.vehicleFaultStatus,
		};
	}
	if (filters.driverSex && filters.driverSex.length > 0) {
		vehicleElemMatch["driver.sex.name"] = { $in: filters.driverSex };
	}
	if (filters.driverLicenceType && filters.driverLicenceType.length > 0) {
		vehicleElemMatch["driver.licence_type.name"] = {
			$in: filters.driverLicenceType,
		};
	}
	if (filters.driverInjuryType && filters.driverInjuryType.length > 0) {
		vehicleElemMatch["driver.injury_type.name"] = {
			$in: filters.driverInjuryType,
		};
	}

	if (Object.keys(vehicleElemMatch).length > 0) {
		matchFilter.vehicle_dtos = { $elemMatch: vehicleElemMatch };
	}

	// --- 3. Define Main Collision Type Mappings ---
	const singleVehicleTypes = [
		"برخورد وسیله نقلیه با شیء ثابت",
		"واژگونی و سقوط",
		"خروج از جاده",
	];
	const twoVehicleType = "برخورد وسیله نقلیه با یک وسیله نقلیه";
	const pedestrianTypes = [
		"برخورد وسیله نقلیه با عابر",
		"بر خورد موتورسیکلت با عابر",
		"برخورد دوچرخه با عابر",
	];
	const motorcycleType = "برخورد وسیله نقلیه با موتورسیکلت";
	const multiVehicleTypes = [
		"برخورد وسیله نقلیه با چند وسیله نقلیه",
		"چند برخوردی",
	];
	const allMainTypes = [
		...singleVehicleTypes,
		twoVehicleType,
		...pedestrianTypes,
		motorcycleType,
		...multiVehicleTypes,
	];

	// --- 4. Define and Execute the Aggregation Pipeline ---
	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$addFields: {
				mainCollisionCategory: {
					$switch: {
						branches: [
							{
								case: {
									$in: [
										"$collision_type.name",
										singleVehicleTypes,
									],
								},
								then: "تک وسیله‌ای",
							},
							{
								case: {
									$eq: [
										"$collision_type.name",
										twoVehicleType,
									],
								},
								then: "دو وسیله‌ای‌",
							},
							{
								case: {
									$in: [
										"$collision_type.name",
										pedestrianTypes,
									],
								},
								then: "وسیله نقلیه با عابر",
							},
							{
								case: {
									$eq: [
										"$collision_type.name",
										motorcycleType,
									],
								},
								then: "وسیله نقلیه با موتور سیکلت",
							},
							{
								case: {
									$in: [
										"$collision_type.name",
										multiVehicleTypes,
									],
								},
								then: "چند وسیله‌ای",
							},
						],
						default: "سایر موارد",
					},
				},
			},
		},
		{
			$facet: {
				"mainDistribution": [
					{
						$group: {
							_id: "$mainCollisionCategory",
							count: { $sum: 1 },
						},
					},
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
				"singleVehicleSubtypes": [
					{ $match: { mainCollisionCategory: "تک وسیله‌ای" } },
					{
						$group: {
							_id: "$collision_type.name",
							count: { $sum: 1 },
						},
					},
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
				"otherCollisionTypes": [
					{
						$match: {
							"collision_type.name": { $nin: allMainTypes },
						},
					},
					{
						$group: {
							_id: "$collision_type.name",
							count: { $sum: 1 },
						},
					},
					{ $sort: { count: -1 } },
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
			},
		},
	];

	const results = await accident.aggregation({ pipeline }).toArray();

	// --- 5. Format and Return the Final Payload ---
	const analyticsData = results[0] || {
		mainDistribution: [],
		singleVehicleSubtypes: [],
		otherCollisionTypes: [],
	};

	return {
		mainChart: analyticsData.mainDistribution,
		singleVehicleChart: analyticsData.singleVehicleSubtypes,
		otherTypesChart: analyticsData.otherCollisionTypes,
	};
};
