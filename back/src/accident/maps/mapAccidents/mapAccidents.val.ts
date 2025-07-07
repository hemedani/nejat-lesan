/**
 * -----------------------------------------------------------------------------
 * FILE: mapAccidents.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The most comprehensive validator for finding accidents, including all possible
 * filters from the master list and pagination controls.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const mapAccidentsValidator = () => {
	return object({
		set: object({
			// --- Pagination ---
			limit: optional(number()),
			skip: optional(number()),

			// --- Core Accident Details ---
			seri: optional(number()),
			serial: optional(number()),
			dateOfAccidentFrom: optional(string()),
			dateOfAccidentTo: optional(string()),
			deadCountMin: optional(number()),
			deadCountMax: optional(number()),
			injuredCountMin: optional(number()),
			injuredCountMax: optional(number()),
			officer: optional(string()),

			// --- Location & Context ---
			province: optional(array(string())),
			city: optional(array(string())),
			road: optional(array(string())),
			trafficZone: optional(array(string())),
			cityZone: optional(array(string())),
			accidentType: optional(array(string())),
			position: optional(array(string())),
			rulingType: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),
			roadRepairType: optional(array(string())),
			shoulderStatus: optional(array(string())),

			// --- Environmental & Reason-based ---
			areaUsages: optional(array(string())),
			airStatuses: optional(array(string())),
			roadDefects: optional(array(string())),
			humanReasons: optional(array(string())),
			vehicleReasons: optional(array(string())),
			roadSurfaceConditions: optional(array(string())),

			// --- Vehicle DTOs Filters ---
			vehicleSystem: optional(array(string())),
			vehicleFaultStatus: optional(array(string())),
			driverSex: optional(array(string())),
			driverLicenceType: optional(array(string())),
			driverInjuryType: optional(array(string())),
		}),
		get: object({
			accidents: enums([1]),
			total: enums([1]),
		}),
	});
};
