/**
 * -----------------------------------------------------------------------------
 * FILE: collisionAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The validator for the collision analytics endpoint. It accepts the full
 * range of filters for consistency with other dashboard components.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

// This validator includes the comprehensive set of filters.
export const collisionAnalyticsValidator = () => {
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

			// --- Location & Context (using arrays for multi-select) ---
			province: optional(array(string())),
			city: optional(array(string())),
			road: optional(array(string())),
			accidentType: optional(array(string())), // e.g., Fatal, Injury
			position: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())), // The specific values for collision_type.name
			roadSituation: optional(array(string())),
			roadSurfaceConditions: optional(array(string())),

			// --- GeoJSON ---
			polygon: optional(geoJSONStruct("Polygon")),

			// --- Vehicle DTOs Filters ---
			vehicleSystem: optional(array(string())),
			vehicleFaultStatus: optional(array(string())),

			// --- Driver in Vehicle DTOs Filters ---
			driverSex: optional(array(string())),
			driverLicenceType: optional(array(string())),
			driverInjuryType: optional(array(string())),
		}),
		get: object({
			mainChart: optional(enums([0, 1])),
			singleVehicleChart: optional(enums([0, 1])),
			otherTypesChart: optional(enums([0, 1])),
		}),
	});
};
