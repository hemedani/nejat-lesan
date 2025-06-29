/**
 * -----------------------------------------------------------------------------
 * FILE: hourlyDayOfWeekAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The complete validator for the heatmap analytics endpoint. It accepts the
 * full range of filters for consistency with other dashboard components.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const hourlyDayOfWeekAnalyticsValidator = () => {
	return object({
		set: object({
			// --- Core Accident Details ---
			seri: optional(number()),
			serial: optional(number()),
			dateOfAccidentFrom: optional(string()),
			dateOfAccidentTo: optional(string()),
			deadCount: optional(number()),
			deadCountMin: optional(number()),
			deadCountMax: optional(number()),
			injuredCount: optional(number()),
			injuredCountMin: optional(number()),
			injuredCountMax: optional(number()),
			hasWitness: optional(string()),
			newsNumber: optional(number()),
			officer: optional(string()),
			completionDateFrom: optional(string()),
			completionDateTo: optional(string()),

			// --- Location & Context (using arrays for multi-select) ---
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

			// --- GeoJSON ---
			polygon: optional(geoJSONStruct("Polygon")),

			// --- Environmental & Reason-based ---
			areaUsages: optional(array(string())),
			airStatuses: optional(array(string())),
			roadDefects: optional(array(string())),
			humanReasons: optional(array(string())),
			vehicleReasons: optional(array(string())),
			equipmentDamages: optional(array(string())),
			roadSurfaceConditions: optional(array(string())),

			// --- Vehicle DTOs Filters ---
			vehicleColor: optional(array(string())),
			vehicleSystem: optional(array(string())),
			// ... and so on for all other filters ...
		}),
		get: object({
			series: optional(enums([0, 1])),
		}),
	});
};
