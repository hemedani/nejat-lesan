/**
 * -----------------------------------------------------------------------------
 * FILE: mapAccidents.fn.ts (Full Filters & Pagination)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function finds and returns a paginated list of accident documents that
 * match a comprehensive set of filters. It uses a specific projection to return
 * only the data needed for the map UI, ensuring optimal performance.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const mapAccidentsFn: ActFn = async (body) => {
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

	// --- Add GeoJSON Polygon Filter ---
	if (filters.polygon) {
		matchFilter.location = {
			$geoWithin: {
				$geometry: filters.polygon,
			},
		};
	}

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

	// --- 3. Define Projection for Map Data ---
	// Select only the fields needed by the frontend to keep the payload small.
	const projection = {
		location: 1,
		"type.name": 1,
		date_of_accident: 1,
		dead_count: 1,
		injured_count: 1,
		"collision_type.name": 1,
		"light_status.name": 1,
		"position.name": 1,
		"road_defects.name": 1,
		"vehicle_dtos.driver.total_reason.name": 1,
		vehicle_dtos_count: { $size: "$vehicle_dtos" },
		motorcycle_count: {
			$size: {
				$filter: {
					input: "$vehicle_dtos",
					as: "vehicle",
					cond: {
						$regexMatch: {
							input: "$$vehicle.plaque_type.name",
							regex: /موتور/,
						},
					},
				},
			},
		},
		// Add more counts as needed...
	};

	// --- 4. Find and Paginate Documents ---
	const accidentsCursor = accident.find({
		filters: matchFilter,
		projection,
	})
		.skip(filters.skip || 0)
		.limit(filters.limit || 1000);

	const [accidentsList, totalCount] = await Promise.all([
		accidentsCursor.toArray(),
		accident.countDocument({ filter: matchFilter }),
	]);

	// --- 5. Return the Paginated Data ---
	return {
		accidents: accidentsList,
		total: totalCount,
	};
};
