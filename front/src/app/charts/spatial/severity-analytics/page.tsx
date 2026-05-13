"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { spatialSeverityAnalytics } from "@/app/actions/accident/spatialSeverityAnalytics";
import { getCityZonesGeoJSON } from "@/app/actions/city/getCityZones";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import SpatialSeverityBarChart from "@/components/charts/spatial/SpatialSeverityBarChart";
import SpatialSeverityMap from "@/components/charts/spatial/SpatialSeverityMap";
import { ReqType, userSchema } from "@/types/declarations/selectInp";
import { GeoJsonData } from "@/types/GeoJsonTypes";
import { getMe } from "@/app/actions/user/getMe";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import { useAuth } from "@/context/AuthContext";

const SpatialSeverityAnalyticsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();
  // Get enabled filters for spatial severity analytics considering enterprise settings
  const ENABLED_FILTERS = getEnabledFiltersForChartWithPermissions(
    "SPATIAL_SEVERITY_ANALYTICS",
    userLevel === "Enterprise" ? enterpriseSettings : undefined,
  );

  // Response interface for spatial severity analytics
  interface SpatialSeverityAnalyticsResponse {
    analytics: {
      barChart: {
        categories: string[];
        series: Array<{
          name: string;
          data: number[];
        }>;
      };
      mapChart: Array<{
        zoneId: string;
        zoneName: string;
        ratio: number;
      }>;
    };
  }

  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<
    SpatialSeverityAnalyticsResponse["analytics"] | null
  >(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);

  // Default filters - city will be set from user settings
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({
    // --- Core Accident Details ---
    seri: undefined,
    serial: undefined,
    dateOfAccidentFrom: undefined,
    dateOfAccidentTo: undefined,
    deadCount: undefined,
    deadCountMin: undefined,
    deadCountMax: undefined,
    injuredCount: undefined,
    injuredCountMin: undefined,
    injuredCountMax: undefined,
    hasWitness: undefined,
    newsNumber: undefined,
    officer: undefined,
    completionDateFrom: undefined,
    completionDateTo: undefined,

    // --- Location & Context (multi-select) ---
    province: [],
    city: [], // Will be set after fetching user data
    road: [],
    trafficZone: [],
    cityZone: [],
    accidentType: [],
    position: [],
    rulingType: [],

    // --- Environmental & Reason-based (multi-select) ---
    lightStatus: [],
    collisionType: [],
    roadSituation: [],
    roadRepairType: [],
    shoulderStatus: [],
    areaUsages: [],
    airStatuses: [],
    roadDefects: [],
    humanReasons: [],
    vehicleReasons: [],
    equipmentDamages: [],
    roadSurfaceConditions: [],

    // --- Attachments ---
    attachmentName: undefined,
    attachmentType: undefined,

    // --- Vehicle DTOs Filters ---
    vehicleColor: [],
    vehicleSystem: [],
    vehiclePlaqueType: [],
    vehicleSystemType: [],
    vehicleFaultStatus: [],
    vehicleInsuranceCo: [],
    vehicleInsuranceNo: undefined,
    vehiclePlaqueUsage: [],
    vehiclePrintNumber: undefined,
    vehiclePlaqueSerialElement: undefined,
    vehicleInsuranceDateFrom: undefined,
    vehicleInsuranceDateTo: undefined,
    vehicleBodyInsuranceCo: [],
    vehicleBodyInsuranceNo: undefined,
    vehicleMotionDirection: [],
    vehicleMaxDamageSections: [],
    vehicleDamageSectionOther: undefined,
    vehicleInsuranceWarrantyLimit: undefined,
    vehicleInsuranceWarrantyLimitMin: undefined,
    vehicleInsuranceWarrantyLimitMax: undefined,

    // --- Driver in Vehicle DTOs Filters ---
    driverSex: [],
    driverFirstName: undefined,
    driverLastName: undefined,
    driverNationalCode: undefined,
    driverLicenceNumber: undefined,
    driverLicenceType: [],
    driverInjuryType: [],
    driverTotalReason: [],

    // --- Passenger in Vehicle DTOs Filters ---
    passengerSex: [],
    passengerFirstName: undefined,
    passengerLastName: undefined,
    passengerNationalCode: undefined,
    passengerInjuryType: [],
    passengerFaultStatus: [],
    passengerTotalReason: [],

    // --- Pedestrian DTOs Filters ---
    pedestrianSex: [],
    pedestrianFirstName: undefined,
    pedestrianLastName: undefined,
    pedestrianNationalCode: undefined,
    pedestrianInjuryType: [],
    pedestrianFaultStatus: [],
    pedestrianTotalReason: [],
  });

  // Load user data and set default city on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userResponse = await getMe();
        if (userResponse.success && userResponse.body) {
          const user: userSchema = userResponse.body;

          // Check if user has cities in settings
          if (user.settings?.cities && user.settings.cities.length > 0) {
            const defaultCity = user.settings.cities[0]?.name;
            setAppliedFilters((prevFilters) => ({
              ...prevFilters,
              city: [defaultCity],
            }));
          } else if (user.settings?.provinces && user.settings.provinces.length > 0) {
            // User has provinces but no cities - fetch cities for the first province
            const provinceId = user.settings.provinces[0]?._id;
            if (provinceId) {
              try {
                const citiesResponse = await getCitiesAction({
                  set: { page: 1, limit: 1, provinceIds: [provinceId] },
                  get: { _id: 1, name: 1 },
                });
                if (citiesResponse.success && citiesResponse.body && citiesResponse.body.length > 0) {
                  const defaultCity = citiesResponse.body[0].name;
                  setAppliedFilters((prevFilters) => ({
                    ...prevFilters,
                    city: [defaultCity],
                  }));
                }
              } catch (err) {
                console.error("Error fetching cities for province:", err);
              }
            }
          }
          // If no cities and no provinces in settings, leave city filter empty
        }
        setInitialLoadCompleted(true);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setInitialLoadCompleted(true);
      }
    };

    loadUserData();
  }, []);

  // Load initial data on component mount after user data is loaded
  useEffect(() => {
    if (initialLoadCompleted) {
      handleApplyFilters(appliedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoadCompleted]);

  // Handle filter submission
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);
    setAnalyticsData(null);
    setGeoJsonData(null);

    try {
      // Build the payload dynamically, only including enabled filters
      const filterPayload: Partial<ReqType["main"]["accident"]["spatialSeverityAnalytics"]["set"]> =
        {};

      // Helper function to check if a filter should be included
      const includeFilter = (filterName: keyof ChartFilterState) => {
        return ENABLED_FILTERS.includes(filterName);
      };

      // --- Core Accident Details ---
      if (includeFilter("seri") && filters.seri !== undefined) filterPayload.seri = filters.seri;
      if (includeFilter("serial") && filters.serial !== undefined)
        filterPayload.serial = filters.serial;
      if (includeFilter("dateOfAccidentFrom") && filters.dateOfAccidentFrom !== undefined)
        filterPayload.dateOfAccidentFrom = filters.dateOfAccidentFrom;
      if (includeFilter("dateOfAccidentTo") && filters.dateOfAccidentTo !== undefined)
        filterPayload.dateOfAccidentTo = filters.dateOfAccidentTo;
      if (includeFilter("deadCount") && filters.deadCount !== undefined)
        filterPayload.deadCount = filters.deadCount;
      if (includeFilter("deadCountMin") && filters.deadCountMin !== undefined)
        filterPayload.deadCountMin = filters.deadCountMin;
      if (includeFilter("deadCountMax") && filters.deadCountMax !== undefined)
        filterPayload.deadCountMax = filters.deadCountMax;
      if (includeFilter("injuredCount") && filters.injuredCount !== undefined)
        filterPayload.injuredCount = filters.injuredCount;
      if (includeFilter("injuredCountMin") && filters.injuredCountMin !== undefined)
        filterPayload.injuredCountMin = filters.injuredCountMin;
      if (includeFilter("injuredCountMax") && filters.injuredCountMax !== undefined)
        filterPayload.injuredCountMax = filters.injuredCountMax;
      if (includeFilter("hasWitness") && filters.hasWitness !== undefined)
        filterPayload.hasWitness = filters.hasWitness;
      if (includeFilter("newsNumber") && filters.newsNumber !== undefined)
        filterPayload.newsNumber = filters.newsNumber;
      if (includeFilter("officer") && filters.officer !== undefined)
        filterPayload.officer = filters.officer;
      if (includeFilter("completionDateFrom") && filters.completionDateFrom !== undefined)
        filterPayload.completionDateFrom = filters.completionDateFrom;
      if (includeFilter("completionDateTo") && filters.completionDateTo !== undefined)
        filterPayload.completionDateTo = filters.completionDateTo;

      // --- Location & Context (multi-select) ---
      if (includeFilter("province") && filters.province !== undefined)
        filterPayload.province = filters.province;
      if (includeFilter("city") && filters.city !== undefined) filterPayload.city = filters.city;
      if (includeFilter("road") && filters.road !== undefined) filterPayload.road = filters.road;
      if (includeFilter("trafficZone") && filters.trafficZone !== undefined)
        filterPayload.trafficZone = filters.trafficZone;
      if (includeFilter("cityZone") && filters.cityZone !== undefined)
        filterPayload.cityZone = filters.cityZone;
      if (includeFilter("accidentType") && filters.accidentType !== undefined)
        filterPayload.accidentType = filters.accidentType;
      if (includeFilter("position") && filters.position !== undefined)
        filterPayload.position = filters.position;
      if (includeFilter("rulingType") && filters.rulingType !== undefined)
        filterPayload.rulingType = filters.rulingType;

      // --- Environmental & Reason-based (multi-select) ---
      if (includeFilter("lightStatus") && filters.lightStatus !== undefined)
        filterPayload.lightStatus = filters.lightStatus;
      if (includeFilter("collisionType") && filters.collisionType !== undefined)
        filterPayload.collisionType = filters.collisionType;
      if (includeFilter("roadSituation") && filters.roadSituation !== undefined)
        filterPayload.roadSituation = filters.roadSituation;
      if (includeFilter("roadRepairType") && filters.roadRepairType !== undefined)
        filterPayload.roadRepairType = filters.roadRepairType;
      if (includeFilter("shoulderStatus") && filters.shoulderStatus !== undefined)
        filterPayload.shoulderStatus = filters.shoulderStatus;
      if (includeFilter("areaUsages") && filters.areaUsages !== undefined)
        filterPayload.areaUsages = filters.areaUsages;
      if (includeFilter("airStatuses") && filters.airStatuses !== undefined)
        filterPayload.airStatuses = filters.airStatuses;
      if (includeFilter("roadDefects") && filters.roadDefects !== undefined)
        filterPayload.roadDefects = filters.roadDefects;
      if (includeFilter("humanReasons") && filters.humanReasons !== undefined)
        filterPayload.humanReasons = filters.humanReasons;
      if (includeFilter("vehicleReasons") && filters.vehicleReasons !== undefined)
        filterPayload.vehicleReasons = filters.vehicleReasons;
      if (includeFilter("equipmentDamages") && filters.equipmentDamages !== undefined)
        filterPayload.equipmentDamages = filters.equipmentDamages;
      if (includeFilter("roadSurfaceConditions") && filters.roadSurfaceConditions !== undefined)
        filterPayload.roadSurfaceConditions = filters.roadSurfaceConditions;

      // --- Attachments ---
      if (includeFilter("attachmentName") && filters.attachmentName !== undefined)
        filterPayload.attachmentName = filters.attachmentName;
      if (includeFilter("attachmentType") && filters.attachmentType !== undefined)
        filterPayload.attachmentType = filters.attachmentType;

      // --- Vehicle DTOs Filters ---
      if (includeFilter("vehicleColor") && filters.vehicleColor !== undefined)
        filterPayload.vehicleColor = filters.vehicleColor;
      if (includeFilter("vehicleSystem") && filters.vehicleSystem !== undefined)
        filterPayload.vehicleSystem = filters.vehicleSystem;
      if (includeFilter("vehiclePlaqueType") && filters.vehiclePlaqueType !== undefined)
        filterPayload.vehiclePlaqueType = filters.vehiclePlaqueType;
      if (includeFilter("vehicleSystemType") && filters.vehicleSystemType !== undefined)
        filterPayload.vehicleSystemType = filters.vehicleSystemType;
      if (includeFilter("vehicleFaultStatus") && filters.vehicleFaultStatus !== undefined)
        filterPayload.vehicleFaultStatus = filters.vehicleFaultStatus;
      if (includeFilter("vehicleInsuranceCo") && filters.vehicleInsuranceCo !== undefined)
        filterPayload.vehicleInsuranceCo = filters.vehicleInsuranceCo;
      if (includeFilter("vehicleInsuranceNo") && filters.vehicleInsuranceNo !== undefined)
        filterPayload.vehicleInsuranceNo = filters.vehicleInsuranceNo;
      if (includeFilter("vehiclePlaqueUsage") && filters.vehiclePlaqueUsage !== undefined)
        filterPayload.vehiclePlaqueUsage = filters.vehiclePlaqueUsage;
      if (includeFilter("vehiclePrintNumber") && filters.vehiclePrintNumber !== undefined)
        filterPayload.vehiclePrintNumber = filters.vehiclePrintNumber;
      if (
        includeFilter("vehiclePlaqueSerialElement") &&
        filters.vehiclePlaqueSerialElement !== undefined
      )
        filterPayload.vehiclePlaqueSerialElement = filters.vehiclePlaqueSerialElement;
      if (includeFilter("vehicleInsuranceDateFrom") && filters.vehicleInsuranceDateFrom !== undefined)
        filterPayload.vehicleInsuranceDateFrom = filters.vehicleInsuranceDateFrom;
      if (includeFilter("vehicleInsuranceDateTo") && filters.vehicleInsuranceDateTo !== undefined)
        filterPayload.vehicleInsuranceDateTo = filters.vehicleInsuranceDateTo;
      if (includeFilter("vehicleBodyInsuranceCo") && filters.vehicleBodyInsuranceCo !== undefined)
        filterPayload.vehicleBodyInsuranceCo = filters.vehicleBodyInsuranceCo;
      if (includeFilter("vehicleBodyInsuranceNo") && filters.vehicleBodyInsuranceNo !== undefined)
        filterPayload.vehicleBodyInsuranceNo = filters.vehicleBodyInsuranceNo;
      if (includeFilter("vehicleMotionDirection") && filters.vehicleMotionDirection !== undefined)
        filterPayload.vehicleMotionDirection = filters.vehicleMotionDirection;
      if (includeFilter("vehicleMaxDamageSections") && filters.vehicleMaxDamageSections !== undefined)
        filterPayload.vehicleMaxDamageSections = filters.vehicleMaxDamageSections;
      if (
        includeFilter("vehicleDamageSectionOther") &&
        filters.vehicleDamageSectionOther !== undefined
      )
        filterPayload.vehicleDamageSectionOther = filters.vehicleDamageSectionOther;
      if (
        includeFilter("vehicleInsuranceWarrantyLimit") &&
        filters.vehicleInsuranceWarrantyLimit !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimit = filters.vehicleInsuranceWarrantyLimit;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMin") &&
        filters.vehicleInsuranceWarrantyLimitMin !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimitMin = filters.vehicleInsuranceWarrantyLimitMin;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMax") &&
        filters.vehicleInsuranceWarrantyLimitMax !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimitMax = filters.vehicleInsuranceWarrantyLimitMax;

      // --- Driver in Vehicle DTOs Filters ---
      if (includeFilter("driverSex") && filters.driverSex !== undefined)
        filterPayload.driverSex = filters.driverSex;
      if (includeFilter("driverFirstName") && filters.driverFirstName !== undefined)
        filterPayload.driverFirstName = filters.driverFirstName;
      if (includeFilter("driverLastName") && filters.driverLastName !== undefined)
        filterPayload.driverLastName = filters.driverLastName;
      if (includeFilter("driverNationalCode") && filters.driverNationalCode !== undefined)
        filterPayload.driverNationalCode = filters.driverNationalCode;
      if (includeFilter("driverLicenceNumber") && filters.driverLicenceNumber !== undefined)
        filterPayload.driverLicenceNumber = filters.driverLicenceNumber;
      if (includeFilter("driverLicenceType") && filters.driverLicenceType !== undefined)
        filterPayload.driverLicenceType = filters.driverLicenceType;
      if (includeFilter("driverInjuryType") && filters.driverInjuryType !== undefined)
        filterPayload.driverInjuryType = filters.driverInjuryType;
      if (includeFilter("driverTotalReason") && filters.driverTotalReason !== undefined)
        filterPayload.driverTotalReason = filters.driverTotalReason;

      // --- Passenger in Vehicle DTOs Filters ---
      if (includeFilter("passengerSex") && filters.passengerSex !== undefined)
        filterPayload.passengerSex = filters.passengerSex;
      if (includeFilter("passengerFirstName") && filters.passengerFirstName !== undefined)
        filterPayload.passengerFirstName = filters.passengerFirstName;
      if (includeFilter("passengerLastName") && filters.passengerLastName !== undefined)
        filterPayload.passengerLastName = filters.passengerLastName;
      if (includeFilter("passengerNationalCode") && filters.passengerNationalCode !== undefined)
        filterPayload.passengerNationalCode = filters.passengerNationalCode;
      if (includeFilter("passengerInjuryType") && filters.passengerInjuryType !== undefined)
        filterPayload.passengerInjuryType = filters.passengerInjuryType;
      if (includeFilter("passengerFaultStatus") && filters.passengerFaultStatus !== undefined)
        filterPayload.passengerFaultStatus = filters.passengerFaultStatus;
      if (includeFilter("passengerTotalReason") && filters.passengerTotalReason !== undefined)
        filterPayload.passengerTotalReason = filters.passengerTotalReason;

      // --- Pedestrian DTOs Filters ---
      if (includeFilter("pedestrianSex") && filters.pedestrianSex !== undefined)
        filterPayload.pedestrianSex = filters.pedestrianSex;
      if (includeFilter("pedestrianFirstName") && filters.pedestrianFirstName !== undefined)
        filterPayload.pedestrianFirstName = filters.pedestrianFirstName;
      if (includeFilter("pedestrianLastName") && filters.pedestrianLastName !== undefined)
        filterPayload.pedestrianLastName = filters.pedestrianLastName;
      if (includeFilter("pedestrianNationalCode") && filters.pedestrianNationalCode !== undefined)
        filterPayload.pedestrianNationalCode = filters.pedestrianNationalCode;
      if (includeFilter("pedestrianInjuryType") && filters.pedestrianInjuryType !== undefined)
        filterPayload.pedestrianInjuryType = filters.pedestrianInjuryType;
      if (includeFilter("pedestrianFaultStatus") && filters.pedestrianFaultStatus !== undefined)
        filterPayload.pedestrianFaultStatus = filters.pedestrianFaultStatus;
      if (includeFilter("pedestrianTotalReason") && filters.pedestrianTotalReason !== undefined)
        filterPayload.pedestrianTotalReason = filters.pedestrianTotalReason;

      // Now cast to the full type since we know all possible fields are covered
      const completeFilterPayload =
        filterPayload as ReqType["main"]["accident"]["spatialSeverityAnalytics"]["set"];

      // Remove undefined values and empty arrays
      const cleanedParams = Object.fromEntries(
        Object.entries(completeFilterPayload).filter(
          ([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      // Run API calls (conditionally fetch GeoJSON if city IDs available)
      const [analyticsResponse, geoJsonResponse] = await Promise.all([
        spatialSeverityAnalytics({
          set: cleanedParams,
          get: { analytics: 1 },
        }),
        filters.city && filters.city.length > 0
          ? getCityZonesGeoJSON(filters.city)
          : Promise.resolve({ success: false, body: null }),
      ]);

      // Handle analytics response
      if (analyticsResponse.success && analyticsResponse.body) {
        // Transform the response to fix the data structure for ApexCharts
        const barSeries = analyticsResponse.body.analytics.barChart.series.map(
          (seriesItem: {
            name: string;
            data?: number[];
            fatalData?: number[];
            injuryData?: number[];
            damageData?: number[];
          }) => ({
            name: seriesItem.name,
            data:
              seriesItem.data ||
              seriesItem.fatalData ||
              seriesItem.injuryData ||
              seriesItem.damageData ||
              [],
          }),
        );
        const categories = analyticsResponse.body.analytics.barChart.categories;

        // Compute severity ratio from bar chart data: dead / (dead + injured)
        const fatalSeries = barSeries.find((s) => s.name.includes("فوت"));
        const injurySeries = barSeries.find((s) => s.name.includes("جرح"));
        let mapChart: Array<{ zoneId: string; zoneName: string; ratio: number }> = [];

        if (fatalSeries && injurySeries && categories) {
          mapChart = categories.map((zoneName: string, idx: number) => {
            const fatal = fatalSeries.data[idx] || 0;
            const injury = injurySeries.data[idx] || 0;
            const total = fatal + injury;
            return {
              zoneId: String(idx),
              zoneName,
              ratio: total > 0 ? fatal / total : 0,
            };
          });
        }

        setAnalyticsData({
          barChart: {
            categories,
            series: barSeries,
          },
          mapChart,
        });
      } else {
        throw new Error("Failed to fetch analytics data");
      }

      // Handle GeoJSON response
      if (geoJsonResponse.success && geoJsonResponse.body) {
        setGeoJsonData({
          type: "FeatureCollection",
          features: geoJsonResponse.body.features || [],
        });
      } else {
        setGeoJsonData(null);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "خطا در دریافت داده‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter configuration
  const getFilterConfig = () => {
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: false,
      lockToSevereAccidents: false,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="spatial" currentChart="severity-analytics" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              initialFilters={appliedFilters}
              title="فیلترهای مقایسه مکانی"
              description="فیلترهای مربوط به تحلیل شدت تصادفات"
              enterpriseSettings={enterpriseSettings}
              activeAdvancedFilters={true}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">مقایسه مکانی سهم شدت تصادفات</h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل و مقایسه سهم شدت تصادفات در مناطق مختلف شهر
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <AppliedFiltersDisplay filters={appliedFilters} />

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-800 font-medium">خطا در دریافت داده‌ها</span>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}

          {/* Charts */}
          <div className="space-y-6">
            {/* Bar Chart */}
            <SpatialSeverityBarChart data={analyticsData?.barChart || null} isLoading={isLoading} />

            {/* Map */}
            <SpatialSeverityMap
              mapData={analyticsData?.mapChart || []}
              geoJsonData={geoJsonData}
              isLoading={isLoading}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default SpatialSeverityAnalyticsPage;
