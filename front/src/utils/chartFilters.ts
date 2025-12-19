// =========================================================================
// src/utils/chartFilters.ts
// =========================================================================

// Utility file for defining enabled filters for different chart types
// This provides a centralized way to manage which filters are available for each chart type

import { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";

// Type for enabled filters
export type EnabledFilters = Array<keyof ChartFilterState>;

// Common filter sets that can be reused across multiple charts
export const COMMON_FILTER_SETS = {
  // Basic filters - common across most charts
  BASIC: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",

    // "officer",
  ] as EnabledFilters,

  // Geographic filters - for spatial analysis
  GEOGRAPHIC: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "position",

    // "officer",
  ] as EnabledFilters,

  // Severity analysis filters
  SEVERITY: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "accidentType",

    // "seri",
    // "serial",
    // "officer",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Comprehensive filters - all available filters
  ALL: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "roadSurfaceConditions",
    "vehicleSystem",
    "vehicleFaultStatus",
    "driverSex",
    "driverLicenceType",
    "driverInjuryType",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,
};

// Specific filter sets for different chart types
export const CHART_SPECIFIC_FILTERS = {
  // Spatial Light Analytics - Based on spatialLightAnalytics API
  SPATIAL_LIGHT_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus", // Key filter for light analytics
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Collision Analytics - Based on collisionAnalytics API
  COLLISION_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "roadSurfaceConditions",
    "equipmentDamages",
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehiclePlaqueUsage",
    "vehicleBodyInsuranceCo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "driverSex",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",
    "passengerSex",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",
    "pedestrianSex",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Road Defects Analytics
  ROAD_DEFECTS_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "roadSurfaceConditions",
    "equipmentDamages",
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehiclePlaqueUsage",
    "vehicleBodyInsuranceCo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "driverSex",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Human Reason Analytics
  HUMAN_REASON_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons", // ← main focus of this chart
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Vehicle Reason Analytics - Based on vehicleReasonAnalytics API
  VEHICLE_REASON_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons", // ← main focus of this chart
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Area Usage Analytics
  AREA_USAGE_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages", // ← main focus of this chart
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Accident Severity Analytics - Now includes all available filters
  ACCIDENT_SEVERITY_ANALYTICS: [
    // Core Accident Details
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // Location & Context
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // Environmental & Reason-based
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // Attachments
    "attachmentName",
    "attachmentType",

    // Vehicle DTOs Filters
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleBodyInsuranceDateFrom",
    "vehicleBodyInsuranceDateTo",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // Driver in Vehicle DTOs Filters
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // Passenger in Vehicle DTOs Filters
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // Pedestrian DTOs Filters
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Monthly/Holiday Analytics - Based on monthlyHolidayAnalytics API
  MONTHLY_HOLIDAY_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "roadSurfaceConditions",
    "equipmentDamages",
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehiclePlaqueUsage",
    "vehicleBodyInsuranceCo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "driverSex",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Hourly/Day of Week Analytics - Based on hourlyDayOfWeekAnalytics API
  HOURLY_DAY_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "roadSurfaceConditions",
    "equipmentDamages",
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehiclePlaqueUsage",
    "vehicleBodyInsuranceCo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "driverSex",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Company Performance Analytics
  COMPANY_PERFORMANCE_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem", // ← main grouping field (manufacturer)
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Total Reason Analytics - Based on totalReasonAnalytics API
  TOTAL_REASON_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Spatial Collision Analytics - Based on spatialCollisionAnalytics API
  SPATIAL_COLLISION_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType", // Key filter for collision analytics
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Hotspots Analytics - Using comprehensive filters for geographic analysis
  HOTSPOTS_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone", // Key filters for geographic hotspot analysis
    "accidentType",
    "limit",
    "skip",

    // "officer",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Regional Analytics
  REGIONAL_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone", // Key filters for regional comparison
    "accidentType",
    "collisionType",
    "areaUsages",

    // "officer",
  ] as EnabledFilters,

  // Safety Index Analytics - Based on spatialSafetyIndexAnalytics API
  SAFETY_INDEX_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Temporal Count Analytics - Based on temporalCountAnalytics API
  TEMPORAL_COUNT_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Temporal Severity Analytics - Based on temporalSeverityAnalytics API
  TEMPORAL_SEVERITY_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Temporal Night Analytics - Based on temporalNightAnalytics API
  TEMPORAL_NIGHT_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",

    // --- Environmental & Reason-based (multi-select) ---
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Temporal Collision Analytics - Based on temporalCollisionAnalytics API
  TEMPORAL_COLLISION_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",

    // --- Environmental & Reason-based (multi-select) ---
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Temporal Damage Analytics - Based on temporalDamageAnalytics API
  TEMPORAL_DAMAGE_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",
    "attachmentName",
    "attachmentType",
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "maxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Temporal Total Reason Analytics - Based on temporalTotalReasonAnalytics API
  TEMPORAL_TOTAL_REASON_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Temporal Unlicensed Drivers Analytics - Based on temporalUnlicensedDriversAnalytics API
  TEMPORAL_UNLICENSED_DRIVERS_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Spatial Severity Analytics - Based on spatialSeverityAnalytics API
  SPATIAL_SEVERITY_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone", // ← spatial unit for this chart
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType",
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Spatial Single Vehicle Analytics - Based on spatialSingleVehicleAnalytics API
  SPATIAL_SINGLE_VEHICLE_ANALYTICS: [
    // --- Core Accident Details ---
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "deadCount",
    "injuredCount",
    "hasWitness",
    "newsNumber",
    "completionDateFrom",
    "completionDateTo",

    // --- Location & Context (multi-select) ---
    "province",
    "city",
    "road",
    "trafficZone",
    "cityZone",
    "accidentType",
    "position",

    // --- Environmental & Reason-based (multi-select) ---
    "lightStatus",
    "collisionType", // Critical field for single vehicle analytics
    "roadSituation",
    "roadRepairType",
    "shoulderStatus",
    "areaUsages",
    "airStatuses",
    "roadDefects",
    "humanReasons",
    "vehicleReasons",
    "equipmentDamages",
    "roadSurfaceConditions",

    // --- Attachments ---
    "attachmentName",
    "attachmentType",

    // --- Vehicle DTOs Filters ---
    "vehicleColor",
    "vehicleSystem",
    "vehiclePlaqueType",
    "vehicleSystemType",
    "vehicleFaultStatus",
    "vehicleInsuranceCo",
    "vehicleInsuranceNo",
    "vehiclePlaqueUsage",
    "vehiclePrintNumber",
    "vehiclePlaqueSerialElement",
    "vehicleInsuranceDateFrom",
    "vehicleInsuranceDateTo",
    "vehicleBodyInsuranceCo",
    "vehicleBodyInsuranceNo",
    "vehicleMotionDirection",
    "vehicleMaxDamageSections",
    "vehicleDamageSectionOther",
    "vehicleInsuranceWarrantyLimit",
    "vehicleInsuranceWarrantyLimitMin",
    "vehicleInsuranceWarrantyLimitMax",

    // --- Driver in Vehicle DTOs Filters ---
    "driverSex",
    "driverFirstName",
    "driverLastName",
    "driverNationalCode",
    "driverLicenceNumber",
    "driverLicenceType",
    "driverInjuryType",
    "driverTotalReason",

    // --- Passenger in Vehicle DTOs Filters ---
    "passengerSex",
    "passengerFirstName",
    "passengerLastName",
    "passengerNationalCode",
    "passengerInjuryType",
    "passengerFaultStatus",
    "passengerTotalReason",

    // --- Pedestrian DTOs Filters ---
    "pedestrianSex",
    "pedestrianFirstName",
    "pedestrianLastName",
    "pedestrianNationalCode",
    "pedestrianInjuryType",
    "pedestrianFaultStatus",
    "pedestrianTotalReason",

    // "seri",
    // "serial",
    // "officer",
    // "rulingType",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Trend Collision Analytics - For trend analysis of collision types
  TREND_COLLISION_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "collisionType",
    "lightStatus",
    "areaUsages",
    "roadSituation",

    // "officer",
  ] as EnabledFilters,

  // Trend Severity Analytics - For trend analysis of accident severity
  TREND_SEVERITY_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "accidentType",
    "collisionType",

    // "officer",
    // "deadCountMin",
    // "deadCountMax",
    // "injuredCountMin",
    // "injuredCountMax",
  ] as EnabledFilters,

  // Monthly Trend Analytics - For monthly trend analysis
  MONTHLY_TREND_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "accidentType",
    "collisionType",
    "lightStatus",
    "areaUsages",

    // "officer",
  ] as EnabledFilters,

  // Yearly Trend Analytics - For yearly trend analysis
  YEARLY_TREND_ANALYTICS: [
    "dateOfAccidentFrom",
    "dateOfAccidentTo",
    "province",
    "city",
    "road",
    "accidentType",
    "collisionType",
    "lightStatus",
    "areaUsages",

    // "officer",
  ] as EnabledFilters,
};

// Helper function to get enabled filters for a specific chart type
export const getEnabledFiltersForChart = (
  chartType: keyof typeof CHART_SPECIFIC_FILTERS,
): EnabledFilters => {
  return CHART_SPECIFIC_FILTERS[chartType];
};

// Helper function to combine multiple filter sets
export const combineFilterSets = (
  ...filterSets: EnabledFilters[]
): EnabledFilters => {
  const combined = new Set<keyof ChartFilterState>();
  filterSets.forEach((set) => {
    set.forEach((filter) => combined.add(filter));
  });
  return Array.from(combined);
};

// Helper function to create custom filter set
export const createCustomFilterSet = (
  baseSet: EnabledFilters,
  additions: EnabledFilters = [],
  removals: EnabledFilters = [],
): EnabledFilters => {
  const filterSet = new Set(baseSet);

  // Add additional filters
  additions.forEach((filter) => filterSet.add(filter));

  // Remove specified filters
  removals.forEach((filter) => filterSet.delete(filter));

  return Array.from(filterSet);
};
