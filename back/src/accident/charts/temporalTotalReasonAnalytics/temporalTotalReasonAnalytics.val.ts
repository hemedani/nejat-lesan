/**
 * -----------------------------------------------------------------------------
 * FILE: temporalTotalReasonAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The most comprehensive validator yet, including all possible filters to ensure
 * maximum consistency and analytical power for this endpoint.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const temporalTotalReasonAnalyticsValidator = () => {
	return object({
		set: object({
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
			road: optional(array(string())),
			accidentType: optional(array(string())),
			position: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),

			// --- Environmental & Reason-based ---
			areaUsages: optional(array(string())),
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
			analytics: enums([1]),
		}),
	});
};
