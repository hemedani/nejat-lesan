"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { spatialSafetyIndexAnalytics } from "@/app/actions/accident/spatialSafetyIndexAnalytics";
import { getGeoJSON } from "@/app/actions/getGeoJSON";

import dynamic from "next/dynamic";
import SpatialSafetyBarChart from "@/components/charts/spatial/SpatialSafetyBarChart";
import { ReqType } from "@/types/declarations/selectInp";

// Get enabled filters for spatial safety index analytics
const ENABLED_FILTERS = getEnabledFiltersForChart("SAFETY_INDEX_ANALYTICS");

// Dynamic import for map component to avoid SSR issues with Leaflet
const SpatialSafetyMap = dynamic(
  () => import("@/components/charts/spatial/SpatialSafetyMap"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  },
);

// Response interface for spatial safety index analytics
interface SpatialSafetyIndexAnalyticsResponse {
  analytics: Array<{
    name: string;
    barChartMetric: number;
    mapChartMetric: number;
  }>;
}

type GroupByType = "province" | "city" | "city_zone";

const SpatialSafetyIndexAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<
    SpatialSafetyIndexAnalyticsResponse["analytics"] | null
  >(null);
  const [geoJsonData, setGeoJsonData] = useState<{
    type: string;
    features: Array<{
      type: string;
      properties: {
        id: string;
        name: string;
        [key: string]: string | number;
      };
      geometry: {
        type: string;
        coordinates: number[][][] | number[][][][];
      };
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByType>("province");
  const [isMounted, setIsMounted] = useState(false);

  // Default filters - empty for initial load to use backend defaults
  const [appliedFilters, setAppliedFilters] = useState<RoadDefectsFilterState>(
    {},
  );

  // Ensure client-side rendering for map component
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load initial data on component mount
  useEffect(() => {
    handleApplyFilters(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload data when groupBy changes
  useEffect(() => {
    if (appliedFilters) {
      handleApplyFilters(appliedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy]);

  // Handle filter submission
  const handleApplyFilters = async (filters: RoadDefectsFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare request details for spatialSafetyIndexAnalytics
      const requestDetails: ReqType["main"]["accident"]["spatialSafetyIndexAnalytics"] =
        {
          set: {
            groupBy: groupBy,
          },
          get: {
            analytics: 1,
          },
        };

      // Apply filters to the request
      if (filters.city && filters.city.length > 0) {
        requestDetails.set.city = filters.city;
      }
      if (filters.dateOfAccidentFrom) {
        requestDetails.set.dateOfAccidentFrom = filters.dateOfAccidentFrom;
      }
      if (filters.dateOfAccidentTo) {
        requestDetails.set.dateOfAccidentTo = filters.dateOfAccidentTo;
      }
      if (filters.province && filters.province.length > 0) {
        requestDetails.set.province = filters.province;
      }
      if (filters.lightStatus && filters.lightStatus.length > 0) {
        requestDetails.set.lightStatus = filters.lightStatus;
      }
      if (filters.collisionType && filters.collisionType.length > 0) {
        requestDetails.set.collisionType = filters.collisionType;
      }

      // Run both API calls concurrently
      const [analyticsResponse, geoJsonResponse] = await Promise.all([
        spatialSafetyIndexAnalytics(requestDetails),
        getGeoJSON(groupBy),
      ]);

      // Debug logging
      console.log("Analytics Response:", analyticsResponse);
      console.log("GeoJSON Response:", geoJsonResponse);
      console.log("Current groupBy:", groupBy);

      // Handle analytics response
      if (analyticsResponse.success && analyticsResponse.body) {
        console.log("Analytics data:", analyticsResponse.body.analytics);
        setAnalyticsData(analyticsResponse.body.analytics);
      } else {
        console.error("Analytics API error:", analyticsResponse.error);
        throw new Error(
          `Failed to fetch analytics data: ${analyticsResponse.error || "Unknown error"}`,
        );
      }

      // Handle GeoJSON response with validation
      if (geoJsonResponse.success && geoJsonResponse.body) {
        const geoData = geoJsonResponse.body;

        // Validate GeoJSON structure
        if (
          geoData.type === "FeatureCollection" &&
          Array.isArray(geoData.features)
        ) {
          console.log(`GeoJSON loaded: ${geoData.features.length} features`);

          // Log sample feature for debugging
          if (geoData.features.length > 0) {
            console.log("Sample feature:", geoData.features[0]);
          }

          setGeoJsonData(geoData);
        } else {
          console.warn("Invalid GeoJSON structure:", geoData);
          setGeoJsonData(null);
          setError("ساختار داده‌های نقشه نامعتبر است");
        }
      } else {
        console.error("GeoJSON API error:", geoJsonResponse.error);
        setGeoJsonData(null);
        setError(
          `خطا در دریافت داده‌های نقشه: ${geoJsonResponse.error || "Unknown error"}`,
        );
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

  // Get display name for groupBy
  const getGroupByDisplayName = (groupBy: GroupByType) => {
    switch (groupBy) {
      case "province":
        return "استان";
      case "city":
        return "شهر";
      case "city_zone":
        return "منطقه";
      default:
        return "استان";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="spatial" currentChart="safety-index" />

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
              description="فیلترهای مربوط به شاخص ناحیه‌ای ایمنی"
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
                  مقایسه مکانی شاخص ناحیه‌ای ایمنی
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل و مقایسه شاخص ایمنی در مناطق مختلف
                </p>
              </div>
              <div className="flex items-center gap-3">
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

          {/* GroupBy Selector */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                سطح تحلیل مکانی
              </h3>
              <div className="flex gap-2">
                {[
                  { value: "province", label: "استان" },
                  { value: "city", label: "شهر" },
                  { value: "city_zone", label: "منطقه" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGroupBy(option.value as GroupByType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      groupBy === option.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Applied Filters Display */}
          <AppliedFiltersDisplay filters={appliedFilters} />

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-800 font-medium">
                  خطا در دریافت داده‌ها
                </span>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}

          {/* Charts */}
          <div className="space-y-6 pb-8">
            {/* Bar Chart */}
            <SpatialSafetyBarChart data={analyticsData} isLoading={isLoading} />

            {/* Map - Only render on client side */}
            {isMounted ? (
              <SpatialSafetyMap
                mapData={analyticsData || []}
                geoJsonData={geoJsonData}
                isLoading={isLoading}
                groupBy={groupBy}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-96 bg-gray-200 rounded"></div>
                </div>
              </div>
            )}
          </div>

          {/* Insights Section */}
          {analyticsData && !isLoading && (
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                بینش‌های کلیدی
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    کل {getGroupByDisplayName(groupBy)} بررسی شده
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    بالاترین نرخ متوفیان
                  </h4>
                  <p className="text-2xl font-bold text-red-600">
                    {analyticsData.length > 0
                      ? Math.max(
                          ...analyticsData.map((d) => d.barChartMetric),
                        ).toFixed(2)
                      : "0"}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    بالاترین شاخص ایمنی
                  </h4>
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData.length > 0
                      ? Math.max(
                          ...analyticsData.map((d) => d.mapChartMetric),
                        ).toFixed(2)
                      : "0"}
                  </p>
                </div>
              </div>

              {/* Additional insights */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    📊 تحلیل شاخص ایمنی منطقه‌ای
                  </h4>
                  <p className="text-sm text-blue-800">
                    این داشبورد شاخص ایمنی را در سطح{" "}
                    {getGroupByDisplayName(groupBy)} نشان می‌دهد. نمودار ستونی
                    نسبت متوفیان به جمعیت و نقشه شاخص ایمنی کلی را نمایش می‌دهد.
                    مناطق با شاخص ایمنی پایین نیاز به توجه بیشتری دارند.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpatialSafetyIndexAnalyticsPage;
