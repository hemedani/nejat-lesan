/**
 * -----------------------------------------------------------------------------
 * FILE: eventSeverityAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The comprehensive validator for the event trend analytics endpoint. It includes
 * specific fields for defining the event's date range and all possible general filters.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const eventSeverityAnalyticsValidator = () => {
	return object({
		set: object({
			// --- Event-Specific Filters ---
			eventDateFrom: optional(string()), // Start date of the event (e.g., Nowruz)
			eventDateTo: optional(string()), // End date of the event

			// --- Comprehensive General Filters ---
			seri: optional(number()),
			serial: optional(number()),
			dateOfAccidentFrom: optional(string()),
			dateOfAccidentTo: optional(string()),
			deadCountMin: optional(number()),
			deadCountMax: optional(number()),
			injuredCountMin: optional(number()),
			injuredCountMax: optional(number()),
			officer: optional(string()),
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
			areaUsages: optional(array(string())),
			airStatuses: optional(array(string())),
			roadDefects: optional(array(string())),
			humanReasons: optional(array(string())),
			vehicleReasons: optional(array(string())),
			roadSurfaceConditions: optional(array(string())),
			vehicleSystem: optional(array(string())),
			driverSex: optional(array(string())),
			driverLicenceType: optional(array(string())),
		}),
		get: object({
			analytics: enums([1]),
		}),
	});
};
