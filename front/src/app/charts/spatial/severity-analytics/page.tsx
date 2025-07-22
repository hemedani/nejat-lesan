"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { spatialSeverityAnalytics } from "@/app/actions/accident/spatialSeverityAnalytics";
import { getCityZonesGeoJSON } from "@/app/actions/city/getCityZones";
import SpatialSeverityBarChart from "@/components/charts/spatial/SpatialSeverityBarChart";
import SpatialSeverityMap from "@/components/charts/spatial/SpatialSeverityMap";
import { ReqType } from "@/types/declarations/selectInp";

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

const SpatialSeverityAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<
    SpatialSeverityAnalyticsResponse["analytics"] | null
  >(null);
  const [geoJsonData, setGeoJsonData] = useState<object | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default filters with "اهواز" pre-selected
  const [appliedFilters, setAppliedFilters] = useState<RoadDefectsFilterState>({
    city: ["اهواز"],
  });

  // Load initial data on component mount
  useEffect(() => {
    handleApplyFilters(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter submission
  const handleApplyFilters = async (filters: RoadDefectsFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare request details for spatialSeverityAnalytics
      const requestDetails: ReqType["main"]["accident"]["spatialSeverityAnalytics"] =
        {
          set: {},
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
      if (filters.roadDefects && filters.roadDefects.length > 0) {
        requestDetails.set.roadDefects = filters.roadDefects;
      }
      if (filters.humanReasons && filters.humanReasons.length > 0) {
        requestDetails.set.humanReasons = filters.humanReasons;
      }
      if (filters.vehicleReasons && filters.vehicleReasons.length > 0) {
        requestDetails.set.vehicleReasons = filters.vehicleReasons;
      }
      if (filters.areaUsages && filters.areaUsages.length > 0) {
        requestDetails.set.areaUsages = filters.areaUsages;
      }

      // Get the city ID for GeoJSON (default to "اهواز" if no city selected)
      const selectedCity =
        filters.city && filters.city.length > 0 ? filters.city[0] : "اهواز";

      // Run both API calls concurrently
      const [analyticsResponse, geoJsonResponse] = await Promise.all([
        spatialSeverityAnalytics(requestDetails),
        getCityZonesGeoJSON(selectedCity),
      ]);

      // Handle analytics response
      if (analyticsResponse.success && analyticsResponse.body) {
        // Filter out any map data items with invalid zoneName values
        const validatedAnalytics = {
          ...analyticsResponse.body.analytics,
          mapChart: analyticsResponse.body.analytics.mapChart.filter(
            (item: { zoneId: string; zoneName: string; ratio: number }) =>
              item && item.zoneName && typeof item.zoneName === "string",
          ),
        };
        setAnalyticsData(validatedAnalytics);
      } else {
        throw new Error("Failed to fetch analytics data");
      }

      // Handle GeoJSON response
      if (geoJsonResponse.success && geoJsonResponse.body) {
        setGeoJsonData(geoJsonResponse.body);
      } else {
        console.warn("Failed to fetch GeoJSON data:", geoJsonResponse.error);
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
      <ChartNavigation
        currentSection="spatial"
        currentChart="severity-analytics"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              initialFilters={appliedFilters}
              title="فیلترهای مقایسه مکانی"
              description="فیلترهای مربوط به تحلیل سهم شدت تصادفات"
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
                  مقایسه مکانی سهم شدت تصادفات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل و مقایسه سهم شدت تصادفات در مناطق مختلف شهر
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
          <div className="space-y-6">
            {/* Bar Chart */}
            <SpatialSeverityBarChart
              data={analyticsData?.barChart || null}
              isLoading={isLoading}
            />

            {/* Map */}
            <SpatialSeverityMap
              mapData={analyticsData?.mapChart || []}
              geoJsonData={geoJsonData}
              isLoading={isLoading}
            />
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
                    کل مناطق بررسی شده
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData.barChart?.categories?.length || 0}
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    مناطق با تصادفات شدید بالا
                  </h4>
                  <p className="text-2xl font-bold text-red-600">
                    {analyticsData.mapChart?.filter((zone) => zone.ratio > 0.6)
                      .length || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    مناطق با شدت متوسط
                  </h4>
                  <p className="text-2xl font-bold text-orange-600">
                    {analyticsData.mapChart?.filter(
                      (zone) => zone.ratio > 0.3 && zone.ratio <= 0.6,
                    ).length || 0}
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    مناطق با تصادفات خفیف بالا
                  </h4>
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData.mapChart?.filter((zone) => zone.ratio <= 0.3)
                      .length || 0}
                  </p>
                </div>
              </div>

              {/* Additional insights */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">
                    📊 تحلیل شدت تصادفات
                  </h4>
                  <p className="text-sm text-red-800">
                    این نمودار نسبت شدت تصادفات را در مناطق مختلف شهر نشان
                    می‌دهد. مناطق با نسبت بالا تصادفات شدید، نیاز فوری به
                    اقدامات ایمنی و بهبود زیرساخت‌های جاده‌ای دارند.
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

export default SpatialSeverityAnalyticsPage;
