/**
 * -----------------------------------------------------------------------------
 * FILE: monthlyHolidayAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Validator for the "monthlyHolidayAnalytics" act.
 *
 * This validator mirrors the full filter set used in other analytics endpoints
 * (e.g., roadDefectsAnalytics) to ensure UI consistency and reuse of filter
 * components in the frontend.
 *
 * All categorical filters are arrays to support multi-select.
 * Range filters (e.g., deadCountMin/Max) allow flexible numeric bounds.
 * Text fields support partial matching (e.g., officer name, national code).
 *
 * The `get` section controls which parts of the response are returned,
 * though currently both `categories` and `series` are always included.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const monthlyHolidayAnalyticsValidator = () => {
	return object({
		set: object({
			// --- Core Accident Details ---
			seri: optional(number()),
			serial: optional(number()),
			dateOfAccidentFrom: optional(string()), // ISO string or Jalali-compatible string
			dateOfAccidentTo: optional(string()),
			deadCount: optional(number()), // Exact match
			deadCountMin: optional(number()), // Range lower bound
			deadCountMax: optional(number()), // Range upper bound
			injuredCount: optional(number()),
			injuredCountMin: optional(number()),
			injuredCountMax: optional(number()),
			hasWitness: optional(string()), // "true" or "false"
			newsNumber: optional(number()),
			officer: optional(string()), // Partial text match
			completionDateFrom: optional(string()),
			completionDateTo: optional(string()),

			// --- Location & Context (multi-select → array) ---
			province: optional(array(string())),
			city: optional(array(string())),
			road: optional(array(string())),
			trafficZone: optional(array(string())),
			cityZone: optional(array(string())),
			accidentType: optional(array(string())), // Linked to 'Type' model
			position: optional(array(string())),
			rulingType: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())),
			roadSituation: optional(array(string())),
			roadRepairType: optional(array(string())),
			shoulderStatus: optional(array(string())),

			// --- GeoJSON Spatial Filter ---
			polygon: optional(geoJSONStruct("Polygon")), // For geospatial queries (not used in current pipeline)

			// --- Environmental & Reason-based (multi-select) ---
			areaUsages: optional(array(string())),
			airStatuses: optional(array(string())),
			roadDefects: optional(array(string())),
			humanReasons: optional(array(string())),
			vehicleReasons: optional(array(string())),
			equipmentDamages: optional(array(string())),
			roadSurfaceConditions: optional(array(string())),

			// --- Attachments ---
			attachmentName: optional(string()),
			attachmentType: optional(string()),

			// --- Vehicle DTOs Filters ---
			vehicleColor: optional(array(string())),
			vehicleSystem: optional(array(string())),
			vehiclePlaqueType: optional(array(string())),
			vehicleSystemType: optional(array(string())),
			vehicleFaultStatus: optional(array(string())),
			vehicleInsuranceCo: optional(array(string())),
			vehicleInsuranceNo: optional(string()), // Exact match
			vehiclePlaqueUsage: optional(array(string())),
			vehiclePrintNumber: optional(string()),
			vehiclePlaqueSerialElement: optional(string()),
			vehicleInsuranceDateFrom: optional(string()),
			vehicleInsuranceDateTo: optional(string()),
			vehicleBodyInsuranceCo: optional(array(string())),
			vehicleBodyInsuranceNo: optional(string()),
			vehicleMotionDirection: optional(array(string())),
			vehicleBodyInsuranceDateFrom: optional(string()),
			vehicleBodyInsuranceDateTo: optional(string()),
			vehicleMaxDamageSections: optional(array(string())),
			vehicleDamageSectionOther: optional(string()),
			vehicleInsuranceWarrantyLimit: optional(number()),
			vehicleInsuranceWarrantyLimitMin: optional(number()),
			vehicleInsuranceWarrantyLimitMax: optional(number()),

			// --- Driver in Vehicle DTOs Filters ---
			driverSex: optional(array(string())),
			driverFirstName: optional(string()), // Partial match
			driverLastName: optional(string()),
			driverNationalCode: optional(string()), // Exact match
			driverLicenceNumber: optional(string()),
			driverLicenceType: optional(array(string())),
			driverInjuryType: optional(array(string())),
			driverTotalReason: optional(array(string())),

			// --- Passenger in Vehicle DTOs Filters ---
			passengerSex: optional(array(string())),
			passengerFirstName: optional(string()),
			passengerLastName: optional(string()),
			passengerNationalCode: optional(string()),
			passengerInjuryType: optional(array(string())),
			passengerFaultStatus: optional(array(string())),
			passengerTotalReason: optional(array(string())),

			// --- Pedestrian DTOs Filters ---
			pedestrianSex: optional(array(string())),
			pedestrianFirstName: optional(string()),
			pedestrianLastName: optional(string()),
			pedestrianNationalCode: optional(string()),
			pedestrianInjuryType: optional(array(string())),
			pedestrianFaultStatus: optional(array(string())),
			pedestrianTotalReason: optional(array(string())),
		}),
		get: object({
			// Controls response shape (currently unused but kept for consistency)
			categories: optional(enums([0, 1])),
			series: optional(enums([0, 1])),
		}),
	});
};
