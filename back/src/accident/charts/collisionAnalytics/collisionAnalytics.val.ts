/**
 * -----------------------------------------------------------------------------
 * FILE: collisionAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Validator for the "collisionAnalytics" act.
 *
 * This validator includes the **complete set of filters** used across all
 * analytics endpoints (mirroring `roadDefectsAnalytics.val.ts`) to ensure:
 * - UI consistency (reuse of filter components)
 * - Deep, contextual analysis of collision types
 *
 * 🔹 All categorical filters are `array(string())` → support **multi-select**.
 * 🔹 Numeric range filters use `Min`/`Max` suffixes (e.g., deadCountMin).
 * 🔹 Text fields (e.g., officer) support **partial matching**.
 * 🔹 Boolean-like fields are omitted here (not relevant to collision focus).
 *
 * The `get` section allows optional response control (though all charts are
 * typically returned together).
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const collisionAnalyticsValidator = () => {
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
			accidentType: optional(array(string())), // e.g., Fatal, Injury
			position: optional(array(string())),
			rulingType: optional(array(string())),
			lightStatus: optional(array(string())),
			collisionType: optional(array(string())), // The specific values for collision_type.name
			roadSituation: optional(array(string())),
			roadRepairType: optional(array(string())),
			shoulderStatus: optional(array(string())),

			// --- GeoJSON Spatial Filter (reserved for future use) ---
			polygon: optional(geoJSONStruct("Polygon")),

			// --- Environmental & Reason-based ---
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
			vehicleInsuranceNo: optional(string()),
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
			driverFirstName: optional(string()),
			driverLastName: optional(string()),
			driverNationalCode: optional(string()),
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
			mainChart: optional(enums([0, 1])),
			singleVehicleChart: optional(enums([0, 1])),
			otherTypesChart: optional(enums([0, 1])),
		}),
	});
};
