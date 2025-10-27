"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { vehicleReasonAnalytics } from "@/app/actions/accident/vehicleReasonAnalytics";
import VehicleReasonDashboard from "@/components/dashboards/VehicleReasonDashboard";
import { ReqType } from "@/types/declarations/selectInp";

// Get enabled filters for vehicle reason analytics
const ENABLED_FILTERS = getEnabledFiltersForChart("VEHICLE_REASON_ANALYTICS");

// Backend response interface for vehicle reason analytics
interface VehicleReasonAnalyticsResponse {
  analytics: {
    pieChart: Array<{
      name: string;
      count: number;
    }>;
    barChart: {
      categories: string[];
      series: Array<{
        name: string;
        data: number[];
      }>;
    };
  };
}

// Demo data for development and fallback
const DEMO_DATA: VehicleReasonAnalyticsResponse["analytics"] = {
  pieChart: [
    { name: "با عامل", count: 1247 },
    { name: "بدون عامل", count: 2856 },
  ],
  barChart: {
    categories: [
      "نقص فنی موتور",
      "نقص سیستم ترمز",
      "فرسودگی لاستیک",
      "نقص چراغ",
      "نقص فرمان",
      "سایر عوامل",
    ],
    series: [
      {
        name: "تعداد تصادفات",
        data: [342, 298, 256, 189, 162, 89],
      },
    ],
  },
};

const VehicleReasonAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [chartData, setChartData] = useState<
    VehicleReasonAnalyticsResponse["analytics"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build the initial payload dynamically with empty values for all enabled filters
      const initialFilterPayload: Partial<
        ReqType["main"]["accident"]["vehicleReasonAnalytics"]["set"]
      > = {};

      // Helper function to check if a filter should be included
      const includeFilter = (filterName: keyof ChartFilterState) => {
        return ENABLED_FILTERS.includes(filterName);
      };

      // --- Core Accident Details ---
      if (includeFilter("seri")) initialFilterPayload.seri = undefined;
      if (includeFilter("serial")) initialFilterPayload.serial = undefined;
      if (includeFilter("dateOfAccidentFrom"))
        initialFilterPayload.dateOfAccidentFrom = "";
      if (includeFilter("dateOfAccidentTo"))
        initialFilterPayload.dateOfAccidentTo = "";
      if (includeFilter("deadCount"))
        initialFilterPayload.deadCount = undefined;
      if (includeFilter("deadCountMin"))
        initialFilterPayload.deadCountMin = undefined;
      if (includeFilter("deadCountMax"))
        initialFilterPayload.deadCountMax = undefined;
      if (includeFilter("injuredCount"))
        initialFilterPayload.injuredCount = undefined;
      if (includeFilter("injuredCountMin"))
        initialFilterPayload.injuredCountMin = undefined;
      if (includeFilter("injuredCountMax"))
        initialFilterPayload.injuredCountMax = undefined;
      if (includeFilter("hasWitness"))
        initialFilterPayload.hasWitness = undefined;
      if (includeFilter("newsNumber"))
        initialFilterPayload.newsNumber = undefined;
      if (includeFilter("officer")) initialFilterPayload.officer = undefined;
      if (includeFilter("completionDateFrom"))
        initialFilterPayload.completionDateFrom = undefined;
      if (includeFilter("completionDateTo"))
        initialFilterPayload.completionDateTo = undefined;

      // --- Location & Context (multi-select) ---
      if (includeFilter("province")) initialFilterPayload.province = [];
      if (includeFilter("city")) initialFilterPayload.city = [];
      if (includeFilter("road")) initialFilterPayload.road = [];
      if (includeFilter("trafficZone")) initialFilterPayload.trafficZone = [];
      if (includeFilter("cityZone")) initialFilterPayload.cityZone = [];
      if (includeFilter("accidentType")) initialFilterPayload.accidentType = [];
      if (includeFilter("position")) initialFilterPayload.position = [];
      if (includeFilter("rulingType")) initialFilterPayload.rulingType = [];

      // --- Environmental & Reason-based (multi-select) ---
      if (includeFilter("lightStatus")) initialFilterPayload.lightStatus = [];
      if (includeFilter("collisionType"))
        initialFilterPayload.collisionType = [];
      if (includeFilter("roadSituation"))
        initialFilterPayload.roadSituation = [];
      if (includeFilter("roadRepairType"))
        initialFilterPayload.roadRepairType = [];
      if (includeFilter("shoulderStatus"))
        initialFilterPayload.shoulderStatus = [];
      if (includeFilter("areaUsages")) initialFilterPayload.areaUsages = [];
      if (includeFilter("airStatuses")) initialFilterPayload.airStatuses = [];
      if (includeFilter("roadDefects")) initialFilterPayload.roadDefects = [];
      if (includeFilter("humanReasons")) initialFilterPayload.humanReasons = [];
      if (includeFilter("vehicleReasons"))
        initialFilterPayload.vehicleReasons = []; // ← main focus of this chart
      if (includeFilter("equipmentDamages"))
        initialFilterPayload.equipmentDamages = [];
      if (includeFilter("roadSurfaceConditions"))
        initialFilterPayload.roadSurfaceConditions = [];

      // --- Attachments ---
      if (includeFilter("attachmentName"))
        initialFilterPayload.attachmentName = undefined;
      if (includeFilter("attachmentType"))
        initialFilterPayload.attachmentType = undefined;

      // --- Vehicle DTOs Filters ---
      if (includeFilter("vehicleColor")) initialFilterPayload.vehicleColor = [];
      if (includeFilter("vehicleSystem"))
        initialFilterPayload.vehicleSystem = [];
      if (includeFilter("vehiclePlaqueType"))
        initialFilterPayload.vehiclePlaqueType = [];
      if (includeFilter("vehicleSystemType"))
        initialFilterPayload.vehicleSystemType = [];
      if (includeFilter("vehicleFaultStatus"))
        initialFilterPayload.vehicleFaultStatus = [];
      if (includeFilter("vehicleInsuranceCo"))
        initialFilterPayload.vehicleInsuranceCo = [];
      if (includeFilter("vehicleInsuranceNo"))
        initialFilterPayload.vehicleInsuranceNo = undefined;
      if (includeFilter("vehiclePlaqueUsage"))
        initialFilterPayload.vehiclePlaqueUsage = [];
      if (includeFilter("vehiclePrintNumber"))
        initialFilterPayload.vehiclePrintNumber = undefined;
      if (includeFilter("vehiclePlaqueSerialElement"))
        initialFilterPayload.vehiclePlaqueSerialElement = undefined;
      if (includeFilter("vehicleInsuranceDateFrom"))
        initialFilterPayload.vehicleInsuranceDateFrom = undefined;
      if (includeFilter("vehicleInsuranceDateTo"))
        initialFilterPayload.vehicleInsuranceDateTo = undefined;
      if (includeFilter("vehicleBodyInsuranceCo"))
        initialFilterPayload.vehicleBodyInsuranceCo = [];
      if (includeFilter("vehicleBodyInsuranceNo"))
        initialFilterPayload.vehicleBodyInsuranceNo = undefined;
      if (includeFilter("vehicleMotionDirection"))
        initialFilterPayload.vehicleMotionDirection = [];
      if (includeFilter("vehicleMaxDamageSections"))
        initialFilterPayload.vehicleMaxDamageSections = [];
      if (includeFilter("vehicleDamageSectionOther"))
        initialFilterPayload.vehicleDamageSectionOther = undefined;
      if (includeFilter("vehicleInsuranceWarrantyLimit"))
        initialFilterPayload.vehicleInsuranceWarrantyLimit = undefined;
      if (includeFilter("vehicleInsuranceWarrantyLimitMin"))
        initialFilterPayload.vehicleInsuranceWarrantyLimitMin = undefined;
      if (includeFilter("vehicleInsuranceWarrantyLimitMax"))
        initialFilterPayload.vehicleInsuranceWarrantyLimitMax = undefined;

      // --- Driver in Vehicle DTOs Filters ---
      if (includeFilter("driverSex")) initialFilterPayload.driverSex = [];
      if (includeFilter("driverFirstName"))
        initialFilterPayload.driverFirstName = undefined;
      if (includeFilter("driverLastName"))
        initialFilterPayload.driverLastName = undefined;
      if (includeFilter("driverNationalCode"))
        initialFilterPayload.driverNationalCode = undefined;
      if (includeFilter("driverLicenceNumber"))
        initialFilterPayload.driverLicenceNumber = undefined;
      if (includeFilter("driverLicenceType"))
        initialFilterPayload.driverLicenceType = [];
      if (includeFilter("driverInjuryType"))
        initialFilterPayload.driverInjuryType = [];
      if (includeFilter("driverTotalReason"))
        initialFilterPayload.driverTotalReason = [];

      // --- Passenger in Vehicle DTOs Filters ---
      if (includeFilter("passengerSex")) initialFilterPayload.passengerSex = [];
      if (includeFilter("passengerFirstName"))
        initialFilterPayload.passengerFirstName = undefined;
      if (includeFilter("passengerLastName"))
        initialFilterPayload.passengerLastName = undefined;
      if (includeFilter("passengerNationalCode"))
        initialFilterPayload.passengerNationalCode = undefined;
      if (includeFilter("passengerInjuryType"))
        initialFilterPayload.passengerInjuryType = [];
      if (includeFilter("passengerFaultStatus"))
        initialFilterPayload.passengerFaultStatus = [];
      if (includeFilter("passengerTotalReason"))
        initialFilterPayload.passengerTotalReason = [];

      // --- Pedestrian DTOs Filters ---
      if (includeFilter("pedestrianSex"))
        initialFilterPayload.pedestrianSex = [];
      if (includeFilter("pedestrianFirstName"))
        initialFilterPayload.pedestrianFirstName = undefined;
      if (includeFilter("pedestrianLastName"))
        initialFilterPayload.pedestrianLastName = undefined;
      if (includeFilter("pedestrianNationalCode"))
        initialFilterPayload.pedestrianNationalCode = undefined;
      if (includeFilter("pedestrianInjuryType"))
        initialFilterPayload.pedestrianInjuryType = [];
      if (includeFilter("pedestrianFaultStatus"))
        initialFilterPayload.pedestrianFaultStatus = [];
      if (includeFilter("pedestrianTotalReason"))
        initialFilterPayload.pedestrianTotalReason = [];

      // Now cast to the full type for the API call
      const completeInitialPayload =
        initialFilterPayload as ReqType["main"]["accident"]["vehicleReasonAnalytics"]["set"];

      const result = await vehicleReasonAnalytics({
        set: completeInitialPayload,
        get: {
          analytics: 1,
        },
      });

      if (result.success && result.body) {
        setChartData(result.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("API failed, using demo data:", result.error);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null); // Clear error when using demo data
      }
    } catch (err) {
      console.warn("Network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(null); // Clear error when using demo data
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter submission
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      // Build the payload dynamically, only including enabled filters
      const filterPayload: Partial<
        ReqType["main"]["accident"]["vehicleReasonAnalytics"]["set"]
      > = {};

      // Helper function to check if a filter should be included
      const includeFilter = (filterName: keyof ChartFilterState) => {
        return ENABLED_FILTERS.includes(filterName);
      };

      // --- Core Accident Details ---
      if (includeFilter("seri")) filterPayload.seri = filters.seri;
      if (includeFilter("serial")) filterPayload.serial = filters.serial;
      if (includeFilter("dateOfAccidentFrom"))
        filterPayload.dateOfAccidentFrom = filters.dateOfAccidentFrom || "";
      if (includeFilter("dateOfAccidentTo"))
        filterPayload.dateOfAccidentTo = filters.dateOfAccidentTo || "";
      if (includeFilter("deadCount"))
        filterPayload.deadCount = filters.deadCount;
      if (includeFilter("deadCountMin"))
        filterPayload.deadCountMin = filters.deadCountMin;
      if (includeFilter("deadCountMax"))
        filterPayload.deadCountMax = filters.deadCountMax;
      if (includeFilter("injuredCount"))
        filterPayload.injuredCount = filters.injuredCount;
      if (includeFilter("injuredCountMin"))
        filterPayload.injuredCountMin = filters.injuredCountMin;
      if (includeFilter("injuredCountMax"))
        filterPayload.injuredCountMax = filters.injuredCountMax;
      if (includeFilter("hasWitness"))
        filterPayload.hasWitness = filters.hasWitness;
      if (includeFilter("newsNumber"))
        filterPayload.newsNumber = filters.newsNumber;
      if (includeFilter("officer")) filterPayload.officer = filters.officer;
      if (includeFilter("completionDateFrom"))
        filterPayload.completionDateFrom = filters.completionDateFrom;
      if (includeFilter("completionDateTo"))
        filterPayload.completionDateTo = filters.completionDateTo;

      // --- Location & Context (multi-select) ---
      if (includeFilter("province"))
        filterPayload.province = filters.province || [];
      if (includeFilter("city")) filterPayload.city = filters.city || [];
      if (includeFilter("road")) filterPayload.road = filters.road || [];
      if (includeFilter("trafficZone"))
        filterPayload.trafficZone = filters.trafficZone || [];
      if (includeFilter("cityZone"))
        filterPayload.cityZone = filters.cityZone || [];
      if (includeFilter("accidentType"))
        filterPayload.accidentType = filters.accidentType || [];
      if (includeFilter("position"))
        filterPayload.position = filters.position || [];
      if (includeFilter("rulingType"))
        filterPayload.rulingType = filters.rulingType || [];

      // --- Environmental & Reason-based (multi-select) ---
      if (includeFilter("lightStatus"))
        filterPayload.lightStatus = filters.lightStatus || [];
      if (includeFilter("collisionType"))
        filterPayload.collisionType = filters.collisionType || [];
      if (includeFilter("roadSituation"))
        filterPayload.roadSituation = filters.roadSituation || [];
      if (includeFilter("roadRepairType"))
        filterPayload.roadRepairType = filters.roadRepairType || [];
      if (includeFilter("shoulderStatus"))
        filterPayload.shoulderStatus = filters.shoulderStatus || [];
      if (includeFilter("areaUsages"))
        filterPayload.areaUsages = filters.areaUsages || [];
      if (includeFilter("airStatuses"))
        filterPayload.airStatuses = filters.airStatuses || [];
      if (includeFilter("roadDefects"))
        filterPayload.roadDefects = filters.roadDefects || [];
      if (includeFilter("humanReasons"))
        filterPayload.humanReasons = filters.humanReasons || [];
      if (includeFilter("vehicleReasons"))
        filterPayload.vehicleReasons = filters.vehicleReasons || []; // ← main focus of this chart
      if (includeFilter("equipmentDamages"))
        filterPayload.equipmentDamages = filters.equipmentDamages || [];
      if (includeFilter("roadSurfaceConditions"))
        filterPayload.roadSurfaceConditions =
          filters.roadSurfaceConditions || [];

      // --- Attachments ---
      if (includeFilter("attachmentName"))
        filterPayload.attachmentName = filters.attachmentName;
      if (includeFilter("attachmentType"))
        filterPayload.attachmentType = filters.attachmentType;

      // --- Vehicle DTOs Filters ---
      if (includeFilter("vehicleColor"))
        filterPayload.vehicleColor = filters.vehicleColor || [];
      if (includeFilter("vehicleSystem"))
        filterPayload.vehicleSystem = filters.vehicleSystem || [];
      if (includeFilter("vehiclePlaqueType"))
        filterPayload.vehiclePlaqueType = filters.vehiclePlaqueType || [];
      if (includeFilter("vehicleSystemType"))
        filterPayload.vehicleSystemType = filters.vehicleSystemType || [];
      if (includeFilter("vehicleFaultStatus"))
        filterPayload.vehicleFaultStatus = filters.vehicleFaultStatus || [];
      if (includeFilter("vehicleInsuranceCo"))
        filterPayload.vehicleInsuranceCo = filters.vehicleInsuranceCo || [];
      if (includeFilter("vehicleInsuranceNo"))
        filterPayload.vehicleInsuranceNo = filters.vehicleInsuranceNo;
      if (includeFilter("vehiclePlaqueUsage"))
        filterPayload.vehiclePlaqueUsage = filters.vehiclePlaqueUsage || [];
      if (includeFilter("vehiclePrintNumber"))
        filterPayload.vehiclePrintNumber = filters.vehiclePrintNumber;
      if (includeFilter("vehiclePlaqueSerialElement"))
        filterPayload.vehiclePlaqueSerialElement =
          filters.vehiclePlaqueSerialElement;
      if (includeFilter("vehicleInsuranceDateFrom"))
        filterPayload.vehicleInsuranceDateFrom =
          filters.vehicleInsuranceDateFrom;
      if (includeFilter("vehicleInsuranceDateTo"))
        filterPayload.vehicleInsuranceDateTo = filters.vehicleInsuranceDateTo;
      if (includeFilter("vehicleBodyInsuranceCo"))
        filterPayload.vehicleBodyInsuranceCo =
          filters.vehicleBodyInsuranceCo || [];
      if (includeFilter("vehicleBodyInsuranceNo"))
        filterPayload.vehicleBodyInsuranceNo = filters.vehicleBodyInsuranceNo;
      if (includeFilter("vehicleMotionDirection"))
        filterPayload.vehicleMotionDirection =
          filters.vehicleMotionDirection || [];
      if (includeFilter("vehicleMaxDamageSections"))
        filterPayload.vehicleMaxDamageSections =
          filters.vehicleMaxDamageSections || [];
      if (includeFilter("vehicleDamageSectionOther"))
        filterPayload.vehicleDamageSectionOther =
          filters.vehicleDamageSectionOther;
      if (includeFilter("vehicleInsuranceWarrantyLimit"))
        filterPayload.vehicleInsuranceWarrantyLimit =
          filters.vehicleInsuranceWarrantyLimit;
      if (includeFilter("vehicleInsuranceWarrantyLimitMin"))
        filterPayload.vehicleInsuranceWarrantyLimitMin =
          filters.vehicleInsuranceWarrantyLimitMin;
      if (includeFilter("vehicleInsuranceWarrantyLimitMax"))
        filterPayload.vehicleInsuranceWarrantyLimitMax =
          filters.vehicleInsuranceWarrantyLimitMax;

      // --- Driver in Vehicle DTOs Filters ---
      if (includeFilter("driverSex"))
        filterPayload.driverSex = filters.driverSex || [];
      if (includeFilter("driverFirstName"))
        filterPayload.driverFirstName = filters.driverFirstName;
      if (includeFilter("driverLastName"))
        filterPayload.driverLastName = filters.driverLastName;
      if (includeFilter("driverNationalCode"))
        filterPayload.driverNationalCode = filters.driverNationalCode;
      if (includeFilter("driverLicenceNumber"))
        filterPayload.driverLicenceNumber = filters.driverLicenceNumber;
      if (includeFilter("driverLicenceType"))
        filterPayload.driverLicenceType = filters.driverLicenceType || [];
      if (includeFilter("driverInjuryType"))
        filterPayload.driverInjuryType = filters.driverInjuryType || [];
      if (includeFilter("driverTotalReason"))
        filterPayload.driverTotalReason = filters.driverTotalReason || [];

      // --- Passenger in Vehicle DTOs Filters ---
      if (includeFilter("passengerSex"))
        filterPayload.passengerSex = filters.passengerSex || [];
      if (includeFilter("passengerFirstName"))
        filterPayload.passengerFirstName = filters.passengerFirstName;
      if (includeFilter("passengerLastName"))
        filterPayload.passengerLastName = filters.passengerLastName;
      if (includeFilter("passengerNationalCode"))
        filterPayload.passengerNationalCode = filters.passengerNationalCode;
      if (includeFilter("passengerInjuryType"))
        filterPayload.passengerInjuryType = filters.passengerInjuryType || [];
      if (includeFilter("passengerFaultStatus"))
        filterPayload.passengerFaultStatus = filters.passengerFaultStatus || [];
      if (includeFilter("passengerTotalReason"))
        filterPayload.passengerTotalReason = filters.passengerTotalReason || [];

      // --- Pedestrian DTOs Filters ---
      if (includeFilter("pedestrianSex"))
        filterPayload.pedestrianSex = filters.pedestrianSex || [];
      if (includeFilter("pedestrianFirstName"))
        filterPayload.pedestrianFirstName = filters.pedestrianFirstName;
      if (includeFilter("pedestrianLastName"))
        filterPayload.pedestrianLastName = filters.pedestrianLastName;
      if (includeFilter("pedestrianNationalCode"))
        filterPayload.pedestrianNationalCode = filters.pedestrianNationalCode;
      if (includeFilter("pedestrianInjuryType"))
        filterPayload.pedestrianInjuryType = filters.pedestrianInjuryType || [];
      if (includeFilter("pedestrianFaultStatus"))
        filterPayload.pedestrianFaultStatus =
          filters.pedestrianFaultStatus || [];
      if (includeFilter("pedestrianTotalReason"))
        filterPayload.pedestrianTotalReason =
          filters.pedestrianTotalReason || [];

      // Now cast to the full type since we know all possible fields are covered
      const completeFilterPayload =
        filterPayload as ReqType["main"]["accident"]["vehicleReasonAnalytics"]["set"];

      const result = await vehicleReasonAnalytics({
        set: completeFilterPayload,
        get: {
          analytics: 1,
        },
      });

      if (result.success && result.body) {
        setChartData(result.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("Filter API failed, using demo data:", result.error);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null); // Clear error when using demo data
      }
    } catch (err) {
      console.warn("Filter network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(null); // Clear error when using demo data
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual data loading
  const handleLoadData = async () => {
    await loadInitialData();
  };

  // Filter configuration
  const getFilterConfig = () => {
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: false,
      lockToSevereAccidents: true, // Lock to severe accidents as per backend requirements
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="overall" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              title="فیلترهای تحلیل عامل وسیله نقلیه"
              description="برای مشاهده توزیع عامل وسیله نقلیه مؤثر در تصادفات، فیلترهای مورد نظر را اعمال کنید"
              enabledFilters={ENABLED_FILTERS}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  تحلیل عوامل فنی وسایل نقلیه
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  نمایش توزیع عوامل فنی مؤثر در وقوع تصادفات به صورت نمودار قطبی
                  (Polar)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  {isLoading ? "در حال بارگذاری..." : "بارگذاری مجدد"}
                </button>
                {isDemoMode && (
                  <button
                    onClick={() => {
                      setIsDemoMode(false);
                      setChartData(null);
                      handleLoadData();
                    }}
                    className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    تلاش مجدد API
                  </button>
                )}
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                  {showFilterSidebar ? "مخفی کردن فیلتر" : "نمایش فیلتر"}
                </button>
              </div>
            </div>
          </div>

          {/* Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Charts Content */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-red-800">خطا</h3>
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Demo Mode Warning */}
            {isDemoMode && chartData && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-yellow-800">حالت نمایشی</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  در حال نمایش داده‌های نمونه - اتصال به API برقرار نشد. برای
                  دریافت داده‌های واقعی، دکمه &quot;تلاش مجدد API&quot; را فشار
                  دهید.
                </p>
              </div>
            )}

            {/* Success Message */}
            {chartData &&
              !isLoading &&
              !isDemoMode &&
              (() => {
                const totalVehicles = chartData.pieChart.reduce(
                  (sum, item) => sum + item.count,
                  0,
                );
                const vehiclesWithFault =
                  chartData.pieChart.find((item) => item.name === "با عامل")
                    ?.count || 0;
                const faultPercentage =
                  totalVehicles > 0
                    ? ((vehiclesWithFault / totalVehicles) * 100).toFixed(1)
                    : "0";
                const mostCommonFault =
                  chartData.barChart.categories.length > 0
                    ? chartData.barChart.categories[0]
                    : "نامشخص";

                return (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <h3 className="font-medium text-green-800">
                        داده‌ها بارگذاری شد
                      </h3>
                    </div>
                    <p className="text-sm text-green-700">
                      تحلیل {totalVehicles.toLocaleString("fa-IR")} وسیله نقلیه
                      با نرخ عامل {faultPercentage}% - شایع‌ترین عامل:{" "}
                      {mostCommonFault}
                    </p>
                  </div>
                );
              })()}

            {/* Vehicle Reason Dashboard */}
            <VehicleReasonDashboard data={chartData} isLoading={isLoading} />

            {/* Statistical Summary */}
            {chartData &&
              !isLoading &&
              (() => {
                const totalVehicles = chartData.pieChart.reduce(
                  (sum, item) => sum + item.count,
                  0,
                );
                const vehiclesWithFault =
                  chartData.pieChart.find((item) => item.name === "با عامل")
                    ?.count || 0;
                const vehiclesWithoutFault =
                  chartData.pieChart.find((item) => item.name === "بدون عامل")
                    ?.count || 0;

                return (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      خلاصه آماری
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {totalVehicles.toLocaleString("fa-IR")}
                        </div>
                        <div className="text-sm text-blue-800">
                          مجموع وسایل نقلیه
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {vehiclesWithFault.toLocaleString("fa-IR")}
                        </div>
                        <div className="text-sm text-red-800">
                          با عامل وسیله نقلیه
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {vehiclesWithoutFault.toLocaleString("fa-IR")}
                        </div>
                        <div className="text-sm text-green-800">
                          بدون عامل وسیله نقلیه
                        </div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">
                          {chartData.barChart.categories.length}
                        </div>
                        <div className="text-sm text-amber-800">
                          انواع عوامل شناسایی شده
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleReasonAnalyticsPage;
