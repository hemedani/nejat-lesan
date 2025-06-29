/**
 * -----------------------------------------------------------------------------
 * FILE: accidentSeverityAnalytics.fn.ts (Full Filters & Lesan Standards)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses the most performant method for this task: running three
 * separate `countDocuments` queries in parallel. It now includes comprehensive
 * filtering logic and adheres to the specified return format.
 */
import type { ActFn, Document } from "@deps";
import { accident } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const accidentSeverityAnalyticsFn: ActFn = async (body) => {
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
	};

	// --- Text-based filters ---
	if (filters.officer) {
		matchFilter.officer = { $regex: new RegExp(filters.officer, "i") };
	}

	// --- Simple array filters using $in ---
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

	// --- Complex array filters using $elemMatch ---
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

	// --- 3. Define Queries for Each Severity Type ---
	const fatalQuery = { ...matchFilter, "type.name": "فوتی" };
	const injuryQuery = { ...matchFilter, "type.name": "جرحی" };
	const damageQuery = { ...matchFilter, "type.name": "خسارتی" };

	// --- 4. Run All Count Queries in Parallel for Maximum Speed ---
	const [fatalCount, injuryCount, damageCount] = await Promise.all([
		accident.countDocument({ filter: fatalQuery }),
		accident.countDocument({ filter: injuryQuery }),
		accident.countDocument({ filter: damageQuery }),
	]);

	// --- 5. Format and Return the Final Payload (Lesan Standard) ---
	return {
		analytics: [
			{ name: "فوتی", count: fatalCount },
			{ name: "جرحی", count: injuryCount },
			{ name: "خسارتی", count: damageCount },
		],
	};
};
