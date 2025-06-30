/**
 * -----------------------------------------------------------------------------
 * FILE: temporalCountAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The complete validator for the temporal count analytics endpoint, accepting
 * a comprehensive range of filters.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const temporalCountAnalyticsValidator = () => {
	return object({
		set: object({
			// Core Accident Details
			dateOfAccidentFrom: optional(string()),
			dateOfAccidentTo: optional(string()),

			// Location
			province: optional(array(string())),
			city: optional(array(string())),
			road: optional(array(string())),

			// Accident Properties
			accidentType: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),
			roadSurfaceConditions: optional(array(string())),
			humanReasons: optional(array(string())),
			roadDefects: optional(array(string())),

			// Vehicle & Driver Properties
			vehicleSystem: optional(array(string())),
			driverSex: optional(array(string())),
			driverLicenceType: optional(array(string())),
		}),
		get: object({
			analytics: enums([1]),
		}),
	});
};
