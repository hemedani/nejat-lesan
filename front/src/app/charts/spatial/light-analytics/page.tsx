"use client";

import React, { useState, useEffect } from "react";
import { GeoJsonData } from "@/types/GeoJsonTypes";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { spatialLightAnalytics } from "@/app/actions/accident/spatialLightAnalytics";
import { getCityZonesGeoJSON } from "@/app/actions/city/getCityZones";
import { getMe } from "@/app/actions/user/getMe";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { userSchema } from "@/types/declarations/selectInp";

import SpatialLightBarChart from "@/components/charts/spatial/SpatialLightBarChart";
import SpatialLightMap from "@/components/charts/spatial/SpatialLightMap";
import { ReqType } from "@/types/declarations/selectInp";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import { useAuth } from "@/context/AuthContext";
import { downloadFullChartData } from "@/utils/exportChartData";

const SpatialLightAnalyticsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();
  // Get enabled filters for spatial light analytics considering enterprise settings
  const ENABLED_FILTERS = getEnabledFiltersForChartWithPermissions(
    "SPATIAL_LIGHT_ANALYTICS",
    userLevel === "Enterprise" ? enterpriseSettings : undefined,
  );

  // Response interface for spatial light analytics
  interface SpatialLightAnalyticsResponse {
    analytics: {
      barChart: {
        categories: string[];
        series: Array<{
          name: string;
          data: number[];
        }>;
      };
      mapChart: Array<{
        name: string;
        ratio: number;
      }>;
    };
  }

  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<
    SpatialLightAnalyticsResponse["analytics"] | null
  >(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null); // Type from backend API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default filters with basic options
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

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
            handleApplyFilters({
              city: [defaultCity],
            });
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
                  handleApplyFilters({
                    city: [defaultCity],
                  });
                }
              } catch (err) {
                console.error("Error fetching cities for province:", err);
              }
            }
          }
          // If no cities and no provinces in settings, leave city filter empty
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter submission
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);

    try {
      // Build the payload dynamically, only including enabled filters
      const filterPayload: Partial<ReqType["main"]["accident"]["spatialLightAnalytics"]["set"]> = {};

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
      if (includeFilter("lightStatus") && filters.lightStatus !== undefined)
        filterPayload.lightStatus = filters.lightStatus;
      if (includeFilter("collisionType") && filters.collisionType !== undefined)
        filterPayload.collisionType = filters.collisionType;
      if (includeFilter("roadSituation") && filters.roadSituation !== undefined)
        filterPayload.roadSituation = filters.roadSituation;
      if (filters.lightStatus && filters.lightStatus.length > 0) {
        filterPayload.lightStatus = filters.lightStatus;
      }
      if (filters.collisionType && filters.collisionType.length > 0) {
        filterPayload.collisionType = filters.collisionType;
      }
      if (filters.roadSituation && filters.roadSituation.length > 0) {
        filterPayload.roadSituation = filters.roadSituation;
      }
      if (filters.roadRepairType && filters.roadRepairType.length > 0) {
        filterPayload.roadRepairType = filters.roadRepairType;
      }
      if (filters.shoulderStatus && filters.shoulderStatus.length > 0) {
        filterPayload.shoulderStatus = filters.shoulderStatus;
      }

      // --- Environmental & Reason-based (multi-select) ---
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
        filterPayload as ReqType["main"]["accident"]["spatialLightAnalytics"]["set"];

      // Remove undefined values
      const cleanedParams = Object.fromEntries(
        Object.entries(completeFilterPayload).filter(
          ([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      // Run API calls (conditionally fetch GeoJSON if city IDs available)
      const [analyticsResponse, geoJsonResponse] = await Promise.all([
        spatialLightAnalytics({
          set: cleanedParams,
          get: { analytics: 1 },
        }),
        filters.city && filters.city.length > 0
          ? getCityZonesGeoJSON(filters.city)
          : Promise.resolve({ success: false, body: null }),
      ]);

      // Handle analytics response
      if (analyticsResponse.success && analyticsResponse.body) {
        setAnalyticsData(analyticsResponse.body.analytics);
      } else {
        throw new Error("Failed to fetch analytics data");
      }

      // Handle GeoJSON response
      if (geoJsonResponse.success && geoJsonResponse.body) {
        // Type assertion to match our stricter GeoJsonData type
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

  // Handle manual reload with current filters
  const handleLoadData = async () => {
    await handleApplyFilters(appliedFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="spatial" currentChart="light-analytics" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              initialFilters={appliedFilters}
              title="فیلترهای مقایسه مکانی"
              description="فیلترهای مربوط به تحلیل وضعیت روشنایی"
              enabledFilters={ENABLED_FILTERS}
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
                <h1 className="text-2xl font-bold text-gray-900">مقایسه مکانی وضعیت روشنایی</h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل و مقایسه وضعیت روشنایی در مناطق مختلف شهر
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {isLoading ? "در حال بارگذاری..." : "بارگذاری مجدد"}
                </button>
                {analyticsData?.barChart && (
                  <button
                    onClick={() =>
                      downloadFullChartData(
                        analyticsData.barChart.categories,
                        analyticsData.barChart.series,
                        "spatial-light",
                      )
                    }
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    دانلود CSV
                  </button>
                )}
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
          <div className="space-y-6 pb-8">
            {/* Bar Chart */}
            <SpatialLightBarChart data={analyticsData?.barChart || null} isLoading={isLoading} />

            {/* Map */}
            <SpatialLightMap
              mapData={analyticsData?.mapChart || []}
              barChartData={analyticsData?.barChart || null}
              geoJsonData={geoJsonData}
              isLoading={isLoading}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default SpatialLightAnalyticsPage;
