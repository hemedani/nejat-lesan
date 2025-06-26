/**
 * -----------------------------------------------------------------------------
 * FILE: roadDefectsAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The complete validator for the analytics endpoint. This is a comprehensive
 * mirror of your `countValidator` to ensure consistent filtering capabilities
 * across the application, with single-choice filters converted to arrays
 * to support multi-select.
 */
import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const roadDefectsAnalyticsValidator = () => {
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

			// --- Location & Context (changed to arrays for multi-select) ---
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

			// --- Attachments ---
			attachmentName: optional(string()),
			attachmentType: optional(string()),

			// --- Vehicle DTOs Filters (changed to arrays for multi-select where applicable) ---
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
			defectDistribution: optional(enums([0, 1])),
			defectCounts: optional(enums([0, 1])),
		}),
	});
};
