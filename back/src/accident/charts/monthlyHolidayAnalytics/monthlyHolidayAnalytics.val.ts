/**
 * -----------------------------------------------------------------------------
 * FILE: monthlyHolidayAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The validator for the new endpoint. It accepts the same comprehensive filter
 * set as our other analytics functions for consistency.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";
// Assuming you have all other fields from the previous validator here.
// For brevity, only a few are shown.
export const monthlyHolidayAnalyticsValidator = () => {
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
			accidentType: optional(array(string())), // Refers to the 'Type' model in your list
			position: optional(array(string())),
			rulingType: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),
			roadRepairType: optional(array(string())),
			shoulderStatus: optional(array(string())),

			// --- GeoJSON ---
			polygon: optional(geoJSONStruct("Polygon")),

			// --- Environmental & Reason-based (arrays for multi-select) ---
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
			vehiclePlaqueType: optional(array(string())),
			vehicleSystemType: optional(array(string())),
			vehicleFaultStatus: optional(array(string())),
			vehicleInsuranceCo: optional(array(string())),
			vehiclePlaqueUsage: optional(array(string())),
			vehicleBodyInsuranceCo: optional(array(string())),
			vehicleMotionDirection: optional(array(string())),
			vehicleMaxDamageSections: optional(array(string())),

			// --- Driver in Vehicle DTOs Filters ---
			driverSex: optional(array(string())),
			driverLicenceType: optional(array(string())),
			driverInjuryType: optional(array(string())),
			driverTotalReason: optional(array(string())),

			// ... other non-array filters like text search ...
			driverFirstName: optional(string()),
			driverLastName: optional(string()),
			driverNationalCode: optional(string()),
			driverLicenceNumber: optional(string()),
		}),
		get: object({
			categories: optional(enums([0, 1])),
			series: optional(enums([0, 1])),
		}),
	});
};
