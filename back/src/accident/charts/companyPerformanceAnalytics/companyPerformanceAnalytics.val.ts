/**
 * -----------------------------------------------------------------------------
 * FILE: companyPerformanceAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The complete validator for the company performance analytics endpoint, accepting
 * a comprehensive range of filters.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const companyPerformanceAnalyticsValidator = () => {
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
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),

			// Vehicle & Driver Properties
			driverSex: optional(array(string())),
			driverLicenceType: optional(array(string())),
		}),
		get: object({
			analytics: enums([1]),
		}),
	});
};
