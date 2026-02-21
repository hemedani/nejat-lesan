import { z } from "zod";

// Define raw filter objects
const coreAccidentDetailsFilterObj = {
  seri: z.boolean().optional(),
  serial: z.boolean().optional(),
  dateOfAccidentFrom: z.boolean().optional(),
  dateOfAccidentTo: z.boolean().optional(),
  deadCount: z.boolean().optional(),
  deadCountMin: z.boolean().optional(),
  deadCountMax: z.boolean().optional(),
  injuredCount: z.boolean().optional(),
  injuredCountMin: z.boolean().optional(),
  injuredCountMax: z.boolean().optional(),
  hasWitness: z.boolean().optional(),
  newsNumber: z.boolean().optional(),
  officer: z.boolean().optional(),
  completionDateFrom: z.boolean().optional(),
  completionDateTo: z.boolean().optional(),
};

const locationAndContextFilterObj = {
  province: z.boolean().optional(),
  city: z.boolean().optional(),
  road: z.boolean().optional(),
  trafficZone: z.boolean().optional(),
  cityZone: z.boolean().optional(),
  accidentType: z.boolean().optional(),
  position: z.boolean().optional(),
  rulingType: z.boolean().optional(),
  lightStatus: z.boolean().optional(),
  collisionType: z.boolean().optional(),
  roadSituation: z.boolean().optional(),
  roadRepairType: z.boolean().optional(),
  shoulderStatus: z.boolean().optional(),
};

const environmentalAndReasonFilterObj = {
  areaUsages: z.boolean().optional(),
  airStatuses: z.boolean().optional(),
  roadDefects: z.boolean().optional(),
  humanReasons: z.boolean().optional(),
  vehicleReasons: z.boolean().optional(),
  equipmentDamages: z.boolean().optional(),
  roadSurfaceConditions: z.boolean().optional(),
};

const attachmentFilterObj = {
  attachmentName: z.boolean().optional(),
  attachmentType: z.boolean().optional(),
};

const vehicleDTOsFilterObj = {
  vehicleColor: z.boolean().optional(),
  vehicleSystem: z.boolean().optional(),
  vehiclePlaqueType: z.boolean().optional(),
  vehicleSystemType: z.boolean().optional(),
  vehicleFaultStatus: z.boolean().optional(),
  vehicleInsuranceCo: z.boolean().optional(),
  vehicleInsuranceNo: z.boolean().optional(),
  vehiclePlaqueUsage: z.boolean().optional(),
  vehiclePrintNumber: z.boolean().optional(),
  vehiclePlaqueSerialElement: z.boolean().optional(),
  vehicleInsuranceDateFrom: z.boolean().optional(),
  vehicleInsuranceDateTo: z.boolean().optional(),
  vehicleBodyInsuranceCo: z.boolean().optional(),
  vehicleBodyInsuranceNo: z.boolean().optional(),
  vehicleMotionDirection: z.boolean().optional(),
  vehicleMaxDamageSections: z.boolean().optional(),
  vehicleDamageSectionOther: z.boolean().optional(),
  vehicleInsuranceWarrantyLimit: z.boolean().optional(),
  vehicleInsuranceWarrantyLimitMin: z.boolean().optional(),
  vehicleInsuranceWarrantyLimitMax: z.boolean().optional(),
  vehicleBodyInsuranceDateFrom: z.boolean().optional(),
  vehicleBodyInsuranceDateTo: z.boolean().optional(),
};

const driverInVehicleDTOsFilterObj = {
  driverSex: z.boolean().optional(),
  driverFirstName: z.boolean().optional(),
  driverLastName: z.boolean().optional(),
  driverNationalCode: z.boolean().optional(),
  driverLicenceNumber: z.boolean().optional(),
  driverLicenceType: z.boolean().optional(),
  driverInjuryType: z.boolean().optional(),
  driverTotalReason: z.boolean().optional(),
};

const passengerInVehicleDTOsFilterObj = {
  passengerSex: z.boolean().optional(),
  passengerFirstName: z.boolean().optional(),
  passengerLastName: z.boolean().optional(),
  passengerNationalCode: z.boolean().optional(),
  passengerInjuryType: z.boolean().optional(),
  passengerFaultStatus: z.boolean().optional(),
  passengerTotalReason: z.boolean().optional(),
};

const pedestrianDTOsFilterObj = {
  pedestrianSex: z.boolean().optional(),
  pedestrianFirstName: z.boolean().optional(),
  pedestrianLastName: z.boolean().optional(),
  pedestrianNationalCode: z.boolean().optional(),
  pedestrianInjuryType: z.boolean().optional(),
  pedestrianFaultStatus: z.boolean().optional(),
  pedestrianTotalReason: z.boolean().optional(),
};

const eventSpecificFilterObj = {
  eventId: z.boolean().optional(),
  eventDateFrom: z.boolean().optional(),
  eventDateTo: z.boolean().optional(),
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
export const coreAccidentDetailsFilters = z.object(coreAccidentDetailsFilterObj);
export const locationAndContextFilters = z.object(locationAndContextFilterObj);
export const environmentalAndReasonFilters = z.object(environmentalAndReasonFilterObj);
export const attachmentFilters = z.object(attachmentFilterObj);
export const vehicleDTOsFilters = z.object(vehicleDTOsFilterObj);
export const driverInVehicleDTOsFilters = z.object(driverInVehicleDTOsFilterObj);
export const passengerInVehicleDTOsFilters = z.object(passengerInVehicleDTOsFilterObj);
export const pedestrianDTOsFilters = z.object(pedestrianDTOsFilterObj);
export const eventSpecificFilters = z.object(eventSpecificFilterObj);

// Constants for common accident analytics filters
export const comprehensiveAnalyticsFilters = z.object(comprehensiveAnalyticsFiltersObj);

// Specific filter for area usage analytics
export const areaUsageAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Specific filter for collision analytics
export const collisionAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Constants for event-specific analytics filters
export const eventAnalyticsFilters = z.object({
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
export const accidentSeverityAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Company performance analytics filter
export const companyPerformanceAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Event collision analytics filter
export const eventCollisionAnalyticFilters = z.object({
  ...eventSpecificFilterObj,
  dateOfAccidentFrom: z.boolean().optional(),
  dateOfAccidentTo: z.boolean().optional(),
  officer: z.boolean().optional(),
  province: z.boolean().optional(),
  city: z.boolean().optional(),
  road: z.boolean().optional(),
  accidentType: z.boolean().optional(),
  position: z.boolean().optional(),
  lightStatus: z.boolean().optional(),
  collisionType: z.boolean().optional(), // Critical filter for this chart
  roadSituation: z.boolean().optional(),
  humanReasons: z.boolean().optional(),
  roadDefects: z.boolean().optional(),
  vehicleSystem: z.boolean().optional(),
  driverSex: z.boolean().optional(),
  driverLicenceType: z.boolean().optional(),
});

// Event severity analytics filter
export const eventSeverityAnalyticFilters = z.object({
  ...eventSpecificFilterObj,
  dateOfAccidentFrom: z.boolean().optional(),
  dateOfAccidentTo: z.boolean().optional(),
  officer: z.boolean().optional(),
  province: z.boolean().optional(),
  city: z.boolean().optional(),
  road: z.boolean().optional(),
  accidentType: z.boolean().optional(),
  position: z.boolean().optional(),
  lightStatus: z.boolean().optional(),
  collisionType: z.boolean().optional(),
  roadSituation: z.boolean().optional(),
  humanReasons: z.boolean().optional(),
  roadDefects: z.boolean().optional(),
  vehicleSystem: z.boolean().optional(),
  driverSex: z.boolean().optional(),
  driverLicenceType: z.boolean().optional(),
});

// Hourly day of week analytics filter
export const hourlyDayOfWeekAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Human reason analytics filter
export const humanReasonAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Monthly holiday analytics filter
export const monthlyHolidayAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Road defects analytics filter
export const roadDefectsAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Spatial collision analytics filter
export const spatialCollisionAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Spatial light analytics filter
export const spatialLightAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Spatial safety index analytics filter
export const spatialSafetyIndexAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  groupBy: z.boolean().optional(), // NEW: Spatial grouping unit
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Spatial severity analytics filter
export const spatialSeverityAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Spatial single vehicle analytics filter
export const spatialSingleVehicleAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Temporal collision analytics filter
export const temporalCollisionAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Temporal count analytics filter
export const temporalCountAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Temporal damage analytics filter
export const temporalDamageAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Temporal night analytics filter
export const temporalNightAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Temporal severity analytics filter
export const temporalSeverityAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Temporal total reason analytics filter
export const temporalTotalReasonAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Temporal unlicensed drivers analytics filter
export const temporalUnlicensedDriversAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Total reason analytics filter
export const totalReasonAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Vehicle reason analytics filter
export const vehicleReasonAnalyticFilters = z.object({
  ...comprehensiveAnalyticsFiltersObj,
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
});

// Map accidents analytics filter — mirrors the mapAccidents validator exactly
export const mapAccidentsAnalyticFilters = z.object({
  // Pagination controls
  limit: z.boolean().optional(),
  skip: z.boolean().optional(),
  polygon: z.boolean().optional(), // GeoJSON Spatial Filter
  // Core accident details
  seri: z.boolean().optional(),
  serial: z.boolean().optional(),
  dateOfAccidentFrom: z.boolean().optional(),
  dateOfAccidentTo: z.boolean().optional(),
  deadCountMin: z.boolean().optional(),
  deadCountMax: z.boolean().optional(),
  injuredCountMin: z.boolean().optional(),
  injuredCountMax: z.boolean().optional(),
  officer: z.boolean().optional(),
  // Location & context
  province: z.boolean().optional(),
  city: z.boolean().optional(),
  road: z.boolean().optional(),
  trafficZone: z.boolean().optional(),
  cityZone: z.boolean().optional(),
  accidentType: z.boolean().optional(),
  position: z.boolean().optional(),
  rulingType: z.boolean().optional(),
  lightStatus: z.boolean().optional(),
  collisionType: z.boolean().optional(),
  roadSituation: z.boolean().optional(),
  roadRepairType: z.boolean().optional(),
  shoulderStatus: z.boolean().optional(),
  // Environmental & reason-based
  areaUsages: z.boolean().optional(),
  airStatuses: z.boolean().optional(),
  roadDefects: z.boolean().optional(),
  humanReasons: z.boolean().optional(),
  vehicleReasons: z.boolean().optional(),
  roadSurfaceConditions: z.boolean().optional(),
  // Vehicle / driver fields
  vehicleSystem: z.boolean().optional(),
  vehicleFaultStatus: z.boolean().optional(),
  driverSex: z.boolean().optional(),
  driverLicenceType: z.boolean().optional(),
  driverInjuryType: z.boolean().optional(),
});

// Combined filter constants for easier access
export const ALL_ANALYTIC_FILTERS = {
  accidentSeverityAnalyticFilters,
  areaUsageAnalyticFilters,
  collisionAnalyticFilters,
  companyPerformanceAnalyticFilters,
  eventCollisionAnalyticFilters,
  eventSeverityAnalyticFilters,
  hourlyDayOfWeekAnalyticFilters,
  humanReasonAnalyticFilters,
  mapAccidentsAnalyticFilters,
  monthlyHolidayAnalyticFilters,
  roadDefectsAnalyticFilters,
  spatialCollisionAnalyticFilters,
  spatialLightAnalyticFilters,
  spatialSafetyIndexAnalyticFilters,
  spatialSeverityAnalyticFilters,
  spatialSingleVehicleAnalyticFilters,
  temporalCollisionAnalyticFilters,
  temporalCountAnalyticFilters,
  temporalDamageAnalyticFilters,
  temporalNightAnalyticFilters,
  temporalSeverityAnalyticFilters,
  temporalTotalReasonAnalyticFilters,
  temporalUnlicensedDriversAnalyticFilters,
  totalReasonAnalyticFilters,
  vehicleReasonAnalyticFilters,
};

// Helper constant for all comprehensive filter fields with Persian labels
export const comprehensiveFilterFields = [
  { key: "seri", label: "سری" },
  { key: "serial", label: "سریال" },
  { key: "dateOfAccidentFrom", label: "تاریخ تصادف از" },
  { key: "dateOfAccidentTo", label: "تاریخ تصادف تا" },
  { key: "deadCount", label: "تعداد کشته" },
  { key: "deadCountMin", label: "حداقل تعداد کشته" },
  { key: "deadCountMax", label: "حداکثر تعداد کشته" },
  { key: "injuredCount", label: "تعداد مجروح" },
  { key: "injuredCountMin", label: "حداقل تعداد مجروح" },
  { key: "injuredCountMax", label: "حداکثر تعداد مجروح" },
  { key: "hasWitness", label: "وجود شاهد" },
  { key: "newsNumber", label: "شماره خبر" },
  { key: "officer", label: "افسر" },
  { key: "completionDateFrom", label: "تاریخ تکمیل از" },
  { key: "completionDateTo", label: "تاریخ تکمیل تا" },
  { key: "polygon", label: "محدوده مکانی" }, // NEW: GeoJSON Spatial Filter
  { key: "province", label: "استان" },
  { key: "city", label: "شهر" },
  { key: "road", label: "جاده" },
  { key: "trafficZone", label: "منطقه ترافیکی" },
  { key: "cityZone", label: "منطقه شهری" },
  { key: "accidentType", label: "نوع حادثه" },
  { key: "position", label: "موقعیت" },
  { key: "rulingType", label: "نوع حکم" },
  { key: "lightStatus", label: "وضعیت نور" },
  { key: "collisionType", label: "نوع برخورد" },
  { key: "roadSituation", label: "وضعیت جاده" },
  { key: "roadRepairType", label: "نوع تعمیر جاده" },
  { key: "shoulderStatus", label: "وضعیت شانه" },
  { key: "areaUsages", label: "کاربری منطقه" },
  { key: "airStatuses", label: "وضعیت هوا" },
  { key: "roadDefects", label: "نقص جاده" },
  { key: "humanReasons", label: "دلایل انسانی" },
  { key: "vehicleReasons", label: "دلایل وسیله نقلیه" },
  { key: "equipmentDamages", label: "خسارات تجهیزات" },
  { key: "roadSurfaceConditions", label: "شرایط سطح جاده" },
  { key: "attachmentName", label: "نام پیوست" },
  { key: "attachmentType", label: "نوع پیوست" },
  { key: "vehicleColor", label: "رنگ وسیله نقلیه" },
  { key: "vehicleSystem", label: "سیستم وسیله نقلیه" },
  { key: "vehiclePlaqueType", label: "نوع پلاک" },
  { key: "vehicleSystemType", label: "نوع سیستم وسیله نقلیه" },
  { key: "vehicleFaultStatus", label: "وضعیت تقصیر وسیله نقلیه" },
  { key: "vehicleInsuranceCo", label: "شرکت بیمه وسیله نقلیه" },
  { key: "vehicleInsuranceNo", label: "شماره بیمه وسیله نقلیه" },
  { key: "vehiclePlaqueUsage", label: "کاربری پلاک" },
  { key: "vehiclePrintNumber", label: "شماره چاپ وسیله نقلیه" },
  { key: "vehiclePlaqueSerialElement", label: "عنصر سریال پلاک" },
  { key: "vehicleInsuranceDateFrom", label: "تاریخ بیمه از" },
  { key: "vehicleInsuranceDateTo", label: "تاریخ بیمه تا" },
  { key: "vehicleBodyInsuranceCo", label: "شرکت بیمه بدنه" },
  { key: "vehicleBodyInsuranceNo", label: "شماره بیمه بدنه" },
  { key: "vehicleMotionDirection", label: "جهت حرکت وسیله نقلیه" },
  { key: "vehicleMaxDamageSections", label: "بیشترین بخش‌های آسیب دیده" },
  { key: "vehicleDamageSectionOther", label: "سایر بخش‌های آسیب دیده" },
  { key: "vehicleInsuranceWarrantyLimit", label: "حد ضمانت بیمه" },
  { key: "vehicleInsuranceWarrantyLimitMin", label: "حداقل حد ضمانت بیمه" },
  { key: "vehicleInsuranceWarrantyLimitMax", label: "حداکثر حد ضمانت بیمه" },
  { key: "vehicleBodyInsuranceDateFrom", label: "تاریخ بیمه بدنه از" },
  { key: "vehicleBodyInsuranceDateTo", label: "تاریخ بیمه بدنه تا" },
  { key: "driverSex", label: "جنسیت راننده" },
  { key: "driverFirstName", label: "نام راننده" },
  { key: "driverLastName", label: "نام خانوادگی راننده" },
  { key: "driverNationalCode", label: "کد ملی راننده" },
  { key: "driverLicenceNumber", label: "شماره گواهینامه" },
  { key: "driverLicenceType", label: "نوع گواهینامه" },
  { key: "driverInjuryType", label: "نوع آسیب راننده" },
  { key: "driverTotalReason", label: "دلیل کل راننده" },
  { key: "passengerSex", label: "جنسیت مسافر" },
  { key: "passengerFirstName", label: "نام مسافر" },
  { key: "passengerLastName", label: "نام خانوادگی مسافر" },
  { key: "passengerNationalCode", label: "کد ملی مسافر" },
  { key: "passengerInjuryType", label: "نوع آسیب مسافر" },
  { key: "passengerFaultStatus", label: "وضعیت تقصیر مسافر" },
  { key: "passengerTotalReason", label: "دلیل کل مسافر" },
  { key: "pedestrianSex", label: "جنسیت عابر پیاده" },
  { key: "pedestrianFirstName", label: "نام عابر پیاده" },
  { key: "pedestrianLastName", label: "نام خانوادگی عابر پیاده" },
  { key: "pedestrianNationalCode", label: "کد ملی عابر پیاده" },
  { key: "pedestrianInjuryType", label: "نوع آسیب عابر پیاده" },
  { key: "pedestrianFaultStatus", label: "وضعیت تقصیر عابر پیاده" },
  { key: "pedestrianTotalReason", label: "دلیل کل عابر پیاده" },
];

// Helper constant for map accidents filter fields with Persian labels
// Only includes the fields the mapAccidents endpoint actually accepts
export const mapAccidentsFilterFields = [
  { key: "limit", label: "تعداد نتایج" },
  { key: "skip", label: "رد کردن نتایج" },
  { key: "polygon", label: "محدوده مکانی" },
  { key: "seri", label: "سری" },
  { key: "serial", label: "سریال" },
  { key: "dateOfAccidentFrom", label: "تاریخ تصادف از" },
  { key: "dateOfAccidentTo", label: "تاریخ تصادف تا" },
  { key: "deadCountMin", label: "حداقل تعداد کشته" },
  { key: "deadCountMax", label: "حداکثر تعداد کشته" },
  { key: "injuredCountMin", label: "حداقل تعداد مجروح" },
  { key: "injuredCountMax", label: "حداکثر تعداد مجروح" },
  { key: "officer", label: "افسر" },
  { key: "province", label: "استان" },
  { key: "city", label: "شهر" },
  { key: "road", label: "جاده" },
  { key: "trafficZone", label: "منطقه ترافیکی" },
  { key: "cityZone", label: "منطقه شهری" },
  { key: "accidentType", label: "نوع حادثه" },
  { key: "position", label: "موقعیت" },
  { key: "rulingType", label: "نوع حکم" },
  { key: "lightStatus", label: "وضعیت نور" },
  { key: "collisionType", label: "نوع برخورد" },
  { key: "roadSituation", label: "وضعیت جاده" },
  { key: "roadRepairType", label: "نوع تعمیر جاده" },
  { key: "shoulderStatus", label: "وضعیت شانه" },
  { key: "areaUsages", label: "کاربری منطقه" },
  { key: "airStatuses", label: "وضعیت هوا" },
  { key: "roadDefects", label: "نقص جاده" },
  { key: "humanReasons", label: "دلایل انسانی" },
  { key: "vehicleReasons", label: "دلایل وسیله نقلیه" },
  { key: "roadSurfaceConditions", label: "شرایط سطح جاده" },
  { key: "vehicleSystem", label: "سیستم وسیله نقلیه" },
  { key: "vehicleFaultStatus", label: "وضعیت تقصیر وسیله نقلیه" },
  { key: "driverSex", label: "جنسیت راننده" },
  { key: "driverLicenceType", label: "نوع گواهینامه" },
  { key: "driverInjuryType", label: "نوع آسیب راننده" },
];

// Helper constant for event filter fields with Persian labels
export const eventFilterFields = [
  { key: "eventId", label: "شناسه رویداد" },
  { key: "eventDateFrom", label: "تاریخ رویداد از" },
  { key: "eventDateTo", label: "تاریخ رویداد تا" },
];

// Type definitions for filter objects
export type CoreAccidentDetailsFilter = z.infer<typeof coreAccidentDetailsFilters>;
export type LocationAndContextFilter = z.infer<typeof locationAndContextFilters>;
export type EnvironmentalAndReasonFilter = z.infer<typeof environmentalAndReasonFilters>;
export type AttachmentFilter = z.infer<typeof attachmentFilters>;
export type VehicleDTOsFilter = z.infer<typeof vehicleDTOsFilters>;
export type DriverInVehicleDTOsFilter = z.infer<typeof driverInVehicleDTOsFilters>;
export type PassengerInVehicleDTOsFilter = z.infer<typeof passengerInVehicleDTOsFilters>;
export type PedestrianDTOsFilter = z.infer<typeof pedestrianDTOsFilters>;
export type EventSpecificFilter = z.infer<typeof eventSpecificFilters>;
export type ComprehensiveAnalyticsFilter = z.infer<typeof comprehensiveAnalyticsFilters>;
export type AreaUsageAnalyticFilter = z.infer<typeof areaUsageAnalyticFilters>;
export type CollisionAnalyticFilter = z.infer<typeof collisionAnalyticFilters>;
export type EventAnalyticsFilter = z.infer<typeof eventAnalyticsFilters>;

// Individual analytic filter types
export type AccidentSeverityAnalyticFilter = z.infer<typeof accidentSeverityAnalyticFilters>;
export type CompanyPerformanceAnalyticFilter = z.infer<typeof companyPerformanceAnalyticFilters>;
export type EventCollisionAnalyticFilter = z.infer<typeof eventCollisionAnalyticFilters>;
export type EventSeverityAnalyticFilter = z.infer<typeof eventSeverityAnalyticFilters>;
export type HourlyDayOfWeekAnalyticFilter = z.infer<typeof hourlyDayOfWeekAnalyticFilters>;
export type HumanReasonAnalyticFilter = z.infer<typeof humanReasonAnalyticFilters>;
export type MonthlyHolidayAnalyticFilter = z.infer<typeof monthlyHolidayAnalyticFilters>;
export type RoadDefectsAnalyticFilter = z.infer<typeof roadDefectsAnalyticFilters>;
export type SpatialCollisionAnalyticFilter = z.infer<typeof spatialCollisionAnalyticFilters>;
export type SpatialLightAnalyticFilter = z.infer<typeof spatialLightAnalyticFilters>;
export type SpatialSafetyIndexAnalyticFilter = z.infer<typeof spatialSafetyIndexAnalyticFilters>;
export type SpatialSeverityAnalyticFilter = z.infer<typeof spatialSeverityAnalyticFilters>;
export type SpatialSingleVehicleAnalyticFilter = z.infer<typeof spatialSingleVehicleAnalyticFilters>;
export type TemporalCollisionAnalyticFilter = z.infer<typeof temporalCollisionAnalyticFilters>;
export type TemporalCountAnalyticFilter = z.infer<typeof temporalCountAnalyticFilters>;
export type TemporalDamageAnalyticFilter = z.infer<typeof temporalDamageAnalyticFilters>;
export type TemporalNightAnalyticFilter = z.infer<typeof temporalNightAnalyticFilters>;
export type TemporalSeverityAnalyticFilter = z.infer<typeof temporalSeverityAnalyticFilters>;
export type TemporalTotalReasonAnalyticFilter = z.infer<typeof temporalTotalReasonAnalyticFilters>;
export type TemporalUnlicensedDriversAnalyticFilter = z.infer<
  typeof temporalUnlicensedDriversAnalyticFilters
>;
export type TotalReasonAnalyticFilter = z.infer<typeof totalReasonAnalyticFilters>;
export type VehicleReasonAnalyticFilter = z.infer<typeof vehicleReasonAnalyticFilters>;
export type MapAccidentsAnalyticFilter = z.infer<typeof mapAccidentsAnalyticFilters>;
