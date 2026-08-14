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

const flattenProjection = (
	obj: Record<string, any>,
	prefix = "",
): Record<string, 1 | 0> => {
	const flat: Record<string, 1 | 0> = {};

	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;

		if (typeof value === "number") {
			flat[path] = value as 1 | 0;
		} else if (value && typeof value === "object") {
			Object.assign(flat, flattenProjection(value, path));
		}
	}

	return flat;
};

// Default field selection used when the client sends an empty projection
// ({}), so the map UI still receives the data it needs.
const defaultProjection = {
	_id: 1,
	location: 1,
	type: { name: 1 },
	date_of_accident: 1,
	dead_count: 1,
	injured_count: 1,
	collision_type: { name: 1 },
	light_status: { name: 1 },
	position: { name: 1 },
	road_defects: { name: 1 },
	vehicle_dtos: { driver: { total_reason: { name: 1 } } },
};

export const mapAccidentsFn: ActFn = async (body) => {
	const { set: filters, get } = body.details;

	// --- 1. Set Default Date Range ---
	let startDate, endDate;
	if (!filters.dateOfAccidentFrom || !filters.dateOfAccidentTo) {
		const now = moment();
		const startJalaliYear = now.jYear() - 3;
		startDate = moment(`${startJalaliYear}/01/01`, "jYYYY/jMM/jDD")
			.startOf("day").toDate();
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
		airPollutionZone: "air_pollution_zone.name",
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

	// --- 3. Build Projection from the Client Get ---
	// Flatten the standard Lesan get projection (selectStruct) into the
	// dot-notation form expected by the aggregation $project stage.
	const flatProjection = flattenProjection(
		Object.keys(get.accidents).length > 0
			? get.accidents
			: defaultProjection,
	);

	// --- 4. Aggregate and Paginate Documents ---
	// Computed counts are always attached so the map UI can render without
	// requesting the whole vehicle_dtos array.
	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$addFields: {
				vehicle_dtos_count: {
					$size: { $ifNull: ["$vehicle_dtos", []] },
				},
				motorcycle_count: {
					$size: {
						$filter: {
							input: { $ifNull: ["$vehicle_dtos", []] },
							as: "vehicle",
							cond: {
								$regexMatch: {
									input: {
										$ifNull: [
											"$$vehicle.plaque_type.name",
											"",
										],
									},
									regex: "موتور",
								},
							},
						},
					},
				},
			},
		},
		{ $skip: filters.skip || 0 },
		{ $limit: filters.limit || 1000 },
		{
			$project: {
				...flatProjection,
				vehicle_dtos_count: 1,
				motorcycle_count: 1,
			},
		},
	];

	const [accidentsList, totalCount] = await Promise.all([
		accident.aggregation({ pipeline }).toArray(),
		accident.countDocument({ filter: matchFilter }),
	]);

	// --- 5. Return the Paginated Data ---
	return {
		accidents: accidentsList,
		total: totalCount,
	};
};
