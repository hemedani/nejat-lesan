/**
 * -----------------------------------------------------------------------------
 * FILE: spatialSafetyIndexAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The comprehensive validator for the spatial safety index endpoint. It includes
 * a new `groupBy` field to allow dynamic spatial analysis.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const spatialSafetyIndexAnalyticsValidator = () => {
	return object({
		set: object({
			// --- New field to determine the spatial unit for grouping ---
			groupBy: enums(["province", "city", "city_zone"]),

			// --- Core Accident Details ---
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
			cityZone: optional(array(string())),
			accidentType: optional(array(string())),
			position: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),

			// --- Vehicle & Driver Filters ---
			vehicleSystem: optional(array(string())),
			driverSex: optional(array(string())),
		}),
		get: object({
			analytics: enums([1]),
		}),
	});
};
