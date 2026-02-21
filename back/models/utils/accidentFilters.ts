import { boolean, object, optional } from "@deps";

// Define raw filter objects
const coreAccidentDetailsFilterObj = {
	seri: optional(boolean()),
	serial: optional(boolean()),
	dateOfAccidentFrom: optional(boolean()),
	dateOfAccidentTo: optional(boolean()),
	deadCount: optional(boolean()),
	deadCountMin: optional(boolean()),
	deadCountMax: optional(boolean()),
	injuredCount: optional(boolean()),
	injuredCountMin: optional(boolean()),
	injuredCountMax: optional(boolean()),
	hasWitness: optional(boolean()),
	newsNumber: optional(boolean()),
	officer: optional(boolean()),
	completionDateFrom: optional(boolean()),
	completionDateTo: optional(boolean()),
};

const locationAndContextFilterObj = {
	province: optional(boolean()),
	city: optional(boolean()),
	road: optional(boolean()),
	trafficZone: optional(boolean()),
	cityZone: optional(boolean()),
	accidentType: optional(boolean()),
	position: optional(boolean()),
	rulingType: optional(boolean()),
	lightStatus: optional(boolean()),
	collisionType: optional(boolean()),
	roadSituation: optional(boolean()),
	roadRepairType: optional(boolean()),
	shoulderStatus: optional(boolean()),
};

const environmentalAndReasonFilterObj = {
	areaUsages: optional(boolean()),
	airStatuses: optional(boolean()),
	roadDefects: optional(boolean()),
	humanReasons: optional(boolean()),
	vehicleReasons: optional(boolean()),
	equipmentDamages: optional(boolean()),
	roadSurfaceConditions: optional(boolean()),
};

const attachmentFilterObj = {
	attachmentName: optional(boolean()),
	attachmentType: optional(boolean()),
};

const vehicleDTOsFilterObj = {
	vehicleColor: optional(boolean()),
	vehicleSystem: optional(boolean()),
	vehiclePlaqueType: optional(boolean()),
	vehicleSystemType: optional(boolean()),
	vehicleFaultStatus: optional(boolean()),
	vehicleInsuranceCo: optional(boolean()),
	vehicleInsuranceNo: optional(boolean()),
	vehiclePlaqueUsage: optional(boolean()),
	vehiclePrintNumber: optional(boolean()),
	vehiclePlaqueSerialElement: optional(boolean()),
	vehicleInsuranceDateFrom: optional(boolean()),
	vehicleInsuranceDateTo: optional(boolean()),
	vehicleBodyInsuranceCo: optional(boolean()),
	vehicleBodyInsuranceNo: optional(boolean()),
	vehicleMotionDirection: optional(boolean()),
	vehicleMaxDamageSections: optional(boolean()),
	vehicleDamageSectionOther: optional(boolean()),
	vehicleInsuranceWarrantyLimit: optional(boolean()),
	vehicleInsuranceWarrantyLimitMin: optional(boolean()),
	vehicleInsuranceWarrantyLimitMax: optional(boolean()),
	vehicleBodyInsuranceDateFrom: optional(boolean()),
	vehicleBodyInsuranceDateTo: optional(boolean()),
};

const driverInVehicleDTOsFilterObj = {
	driverSex: optional(boolean()),
	driverFirstName: optional(boolean()),
	driverLastName: optional(boolean()),
	driverNationalCode: optional(boolean()),
	driverLicenceNumber: optional(boolean()),
	driverLicenceType: optional(boolean()),
	driverInjuryType: optional(boolean()),
	driverTotalReason: optional(boolean()),
};

const passengerInVehicleDTOsFilterObj = {
	passengerSex: optional(boolean()),
	passengerFirstName: optional(boolean()),
	passengerLastName: optional(boolean()),
	passengerNationalCode: optional(boolean()),
	passengerInjuryType: optional(boolean()),
	passengerFaultStatus: optional(boolean()),
	passengerTotalReason: optional(boolean()),
};

const pedestrianDTOsFilterObj = {
	pedestrianSex: optional(boolean()),
	pedestrianFirstName: optional(boolean()),
	pedestrianLastName: optional(boolean()),
	pedestrianNationalCode: optional(boolean()),
	pedestrianInjuryType: optional(boolean()),
	pedestrianFaultStatus: optional(boolean()),
	pedestrianTotalReason: optional(boolean()),
};

const eventSpecificFilterObj = {
	eventId: optional(boolean()),
	eventDateFrom: optional(boolean()),
	eventDateTo: optional(boolean()),
};

const comprehensiveAnalyticsFiltersObj = {
	...coreAccidentDetailsFilterObj,
	...locationAndContextFilterObj,
	...environmentalAndReasonFilterObj,
	...attachmentFilterObj,
	...vehicleDTOsFilterObj,
	...driverInVehicleDTOsFilterObj,
	...passengerInVehicleDTOsFilterObj,
	...pedestrianDTOsFilterObj,
};

// Export the objects as structured filters
export const coreAccidentDetailsFilters = object(coreAccidentDetailsFilterObj);
export const locationAndContextFilters = object(locationAndContextFilterObj);
export const environmentalAndReasonFilters = object(
	environmentalAndReasonFilterObj,
);
export const attachmentFilters = object(attachmentFilterObj);
export const vehicleDTOsFilters = object(vehicleDTOsFilterObj);
export const driverInVehicleDTOsFilters = object(driverInVehicleDTOsFilterObj);
export const passengerInVehicleDTOsFilters = object(
	passengerInVehicleDTOsFilterObj,
);
export const pedestrianDTOsFilters = object(pedestrianDTOsFilterObj);
export const eventSpecificFilters = object(eventSpecificFilterObj);

// Constants for common accident analytics filters
export const comprehensiveAnalyticsFilters = object(
	comprehensiveAnalyticsFiltersObj,
);

// Specific filter for area usage analytics
export const areaUsageAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Specific filter for collision analytics
export const collisionAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Constants for event-specific analytics filters
export const eventAnalyticsFilters = object({
	...eventSpecificFilterObj,
	...coreAccidentDetailsFilterObj,
	...locationAndContextFilterObj,
	...environmentalAndReasonFilterObj,
	...attachmentFilterObj,
	...vehicleDTOsFilterObj,
	...driverInVehicleDTOsFilterObj,
	...passengerInVehicleDTOsFilterObj,
	...pedestrianDTOsFilterObj,
});

// Specific filters for individual analytics endpoints

// Accident severity analytics filter
export const accidentSeverityAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Company performance analytics filter
export const companyPerformanceAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Event collision analytics filter
export const eventCollisionAnalyticFilters = object({
	...eventSpecificFilterObj,
	dateOfAccidentFrom: optional(boolean()),
	dateOfAccidentTo: optional(boolean()),
	officer: optional(boolean()),
	province: optional(boolean()),
	city: optional(boolean()),
	road: optional(boolean()),
	accidentType: optional(boolean()),
	position: optional(boolean()),
	lightStatus: optional(boolean()),
	collisionType: optional(boolean()), // Critical filter for this chart
	roadSituation: optional(boolean()),
	humanReasons: optional(boolean()),
	roadDefects: optional(boolean()),
	vehicleSystem: optional(boolean()),
	driverSex: optional(boolean()),
	driverLicenceType: optional(boolean()),
});

// Event severity analytics filter
export const eventSeverityAnalyticFilters = object({
	...eventSpecificFilterObj,
	dateOfAccidentFrom: optional(boolean()),
	dateOfAccidentTo: optional(boolean()),
	officer: optional(boolean()),
	province: optional(boolean()),
	city: optional(boolean()),
	road: optional(boolean()),
	accidentType: optional(boolean()),
	position: optional(boolean()),
	lightStatus: optional(boolean()),
	collisionType: optional(boolean()),
	roadSituation: optional(boolean()),
	humanReasons: optional(boolean()),
	roadDefects: optional(boolean()),
	vehicleSystem: optional(boolean()),
	driverSex: optional(boolean()),
	driverLicenceType: optional(boolean()),
});

// Hourly day of week analytics filter
export const hourlyDayOfWeekAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Human reason analytics filter
export const humanReasonAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Monthly holiday analytics filter
export const monthlyHolidayAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Road defects analytics filter
export const roadDefectsAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Spatial collision analytics filter
export const spatialCollisionAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Spatial light analytics filter
export const spatialLightAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Spatial safety index analytics filter
export const spatialSafetyIndexAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	groupBy: optional(boolean()), // NEW: Spatial grouping unit
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Spatial severity analytics filter
export const spatialSeverityAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Spatial single vehicle analytics filter
export const spatialSingleVehicleAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Temporal collision analytics filter
export const temporalCollisionAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Temporal count analytics filter
export const temporalCountAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Temporal damage analytics filter
export const temporalDamageAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Temporal night analytics filter
export const temporalNightAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Temporal severity analytics filter
export const temporalSeverityAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Temporal total reason analytics filter
export const temporalTotalReasonAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Temporal unlicensed drivers analytics filter
export const temporalUnlicensedDriversAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Total reason analytics filter
export const totalReasonAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Vehicle reason analytics filter
export const vehicleReasonAnalyticFilters = object({
	...comprehensiveAnalyticsFiltersObj,
	polygon: optional(boolean()), // GeoJSON Spatial Filter
});

// Map accidents filter
export const mapAccidentsAnalyticFilters = object({
	// GeoJSON Spatial Filter
	polygon: optional(boolean()),

	// Pagination
	limit: optional(boolean()),
	skip: optional(boolean()),

	// Core Accident Details
	seri: optional(boolean()),
	serial: optional(boolean()),
	dateOfAccidentFrom: optional(boolean()),
	dateOfAccidentTo: optional(boolean()),
	deadCountMin: optional(boolean()),
	deadCountMax: optional(boolean()),
	injuredCountMin: optional(boolean()),
	injuredCountMax: optional(boolean()),
	officer: optional(boolean()),

	// Location & Context
	province: optional(boolean()),
	city: optional(boolean()),
	road: optional(boolean()),
	trafficZone: optional(boolean()),
	cityZone: optional(boolean()),
	accidentType: optional(boolean()),
	position: optional(boolean()),
	rulingType: optional(boolean()),
	lightStatus: optional(boolean()),
	collisionType: optional(boolean()),
	roadSituation: optional(boolean()),
	roadRepairType: optional(boolean()),
	shoulderStatus: optional(boolean()),

	// Environmental & Reason-based
	areaUsages: optional(boolean()),
	airStatuses: optional(boolean()),
	roadDefects: optional(boolean()),
	humanReasons: optional(boolean()),
	vehicleReasons: optional(boolean()),
	roadSurfaceConditions: optional(boolean()),

	// Vehicle DTOs Filters
	vehicleSystem: optional(boolean()),
	vehicleFaultStatus: optional(boolean()),

	// Driver DTOs Filters
	driverSex: optional(boolean()),
	driverLicenceType: optional(boolean()),
	driverInjuryType: optional(boolean()),
});
