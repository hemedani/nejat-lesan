/**
 * -----------------------------------------------------------------------------
 * FILE: eventCollisionAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The comprehensive validator for the event trend collision analytics endpoint.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const eventCollisionAnalyticsValidator = () => {
	return object({
		set: object({
			// --- Event-Specific Filters ---
			eventDateFrom: optional(string()),
			eventDateTo: optional(string()),

			// --- Comprehensive General Filters ---
			dateOfAccidentFrom: optional(string()),
			dateOfAccidentTo: optional(string()),
			officer: optional(string()),
			province: optional(array(string())),
			city: optional(array(string())),
			road: optional(array(string())),
			accidentType: optional(array(string())),
			position: optional(array(string())),
			lightStatus: optional(array(string())),
			// This is the CRITICAL filter for this chart
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),
			humanReasons: optional(array(string())),
			roadDefects: optional(array(string())),
			vehicleSystem: optional(array(string())),
			driverSex: optional(array(string())),
			driverLicenceType: optional(array(string())),
		}),
		get: object({
			analytics: enums([1]),
		}),
	});
};
