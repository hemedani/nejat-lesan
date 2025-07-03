/**
 * -----------------------------------------------------------------------------
 * FILE: temporalDamageAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The comprehensive validator for the temporal damage analytics endpoint,
 * including the new `maxDamageSections` filter.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const temporalDamageAnalyticsValidator = () => {
	return object({
		set: object({
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
			accidentType: optional(array(string())),
			position: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),

			// --- Vehicle & Damage Filters ---
			vehicleSystem: optional(array(string())),
			// This is the CRITICAL filter for this chart
			maxDamageSections: optional(array(string())),
			driverSex: optional(array(string())),
			driverLicenceType: optional(array(string())),
		}),
		get: object({
			analytics: enums([1]),
		}),
	});
};
