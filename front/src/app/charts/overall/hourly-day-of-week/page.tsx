"use client";

import React, { useState, useEffect, useCallback } from "react";
import HourlyDayOfWeekHeatmap from "@/components/charts/HourlyDayOfWeekHeatmap";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { hourlyDayOfWeekAnalytics } from "@/app/actions/accident/hourlyDayOfWeekAnalytics";
import { formatNumber } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";

// Get enabled filters for hourly day of week analytics considering enterprise settings
const HourlyDayOfWeekPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();
  const ENABLED_FILTERS = getEnabledFiltersForChartWithPermissions(
    "HOURLY_DAY_OF_WEEK_ANALYTICS",
    userLevel === "Enterprise" ? enterpriseSettings : undefined,
  );
  console.log({ enterpriseSettings, ENABLED_FILTERS });

  // Backend response interface for hourly day of week analytics
  interface HourlyDayOfWeekAnalyticsRawData {
    series: Array<{
      name: string;
      data: number[];
    }>;
  }

  // Transformed data interface for the chart component
  interface HourlyDayOfWeekAnalyticsData {
    series: Array<{
      name: string;
      data: Array<{
        x: string;
        y: number;
      }>;
    }>;
    totalAccidents: number;
    peakHour: string;
    peakDay: string;
    averageHourly: number;
  }

  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [chartData, setChartData] = useState<HourlyDayOfWeekAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform raw data to chart format and calculate statistics
  const transformData = useCallback(
    (rawData: HourlyDayOfWeekAnalyticsRawData): HourlyDayOfWeekAnalyticsData => {
      // Transform series data to include hour labels
      const transformedSeries = rawData.series.map((day) => ({
        name: day.name,
        data: day.data.map((value, index) => ({
          x: index.toString(), // Hour as string (0-23)
          y: value,
        })),
      }));

      // Calculate total accidents
      const totalAccidents = rawData.series.reduce((total, day) => {
        return total + day.data.reduce((dayTotal, count) => dayTotal + count, 0);
      }, 0);

      // Find peak hour (hour with most accidents across all days)
      const hourlyTotals = Array(24).fill(0);
      rawData.series.forEach((day) => {
        day.data.forEach((count, hour) => {
          hourlyTotals[hour] += count;
        });
      });
      const peakHourIndex = hourlyTotals.indexOf(Math.max(...hourlyTotals));
      const peakHour = `${formatNumber(peakHourIndex)}:۰۰`;

      // Find peak day (day with most accidents)
      const dayTotals = rawData.series.map((day) => ({
        name: day.name,
        total: day.data.reduce((sum, count) => sum + count, 0),
      }));
      const peakDay = dayTotals.reduce((max, day) => (day.total > max.total ? day : max)).name;

      // Calculate average hourly accidents
      const averageHourly = Math.round(totalAccidents / (rawData.series.length * 24));

      return {
        series: transformedSeries,
        totalAccidents,
        peakHour,
        peakDay,
        averageHourly,
      };
    },
    [],
  );

  // Load initial data on component mount
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await hourlyDayOfWeekAnalytics({
        set: {
          province: [],
          city: [],
          dateOfAccidentFrom: "",
          dateOfAccidentTo: "",
        },
        get: {
          series: 1,
        },
      });

      if (result.success) {
        const transformedData = transformData(result.body);
        setChartData(transformedData);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل ساعتی روز هفته");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  }, [transformData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle filter submission
  const handleFilterSubmit = async (filters: ChartFilterState) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await hourlyDayOfWeekAnalytics({
        set: {
          // Core Accident Details
          dateOfAccidentFrom: filters.dateOfAccidentFrom || "",
          dateOfAccidentTo: filters.dateOfAccidentTo || "",
          deadCountMin: filters.deadCountMin,
          deadCountMax: filters.deadCountMax,
          injuredCountMin: filters.injuredCountMin,
          injuredCountMax: filters.injuredCountMax,

          // Location & Context
          province: filters.province || [],
          city: filters.city || [],
          road: filters.road || [],
          trafficZone: filters.trafficZone || [],
          cityZone: filters.cityZone || [],
          accidentType: filters.accidentType || [],
          position: filters.position || [],
          rulingType: filters.rulingType || [],

          // Accident Characteristics
          lightStatus: filters.lightStatus || [],
          collisionType: filters.collisionType || [],
          roadSituation: filters.roadSituation || [],
          roadRepairType: filters.roadRepairType || [],
          shoulderStatus: filters.shoulderStatus || [],

          // Environmental & Reason-based
          areaUsages: filters.areaUsages || [],
          airStatuses: filters.airStatuses || [],
          roadDefects: filters.roadDefects || [],
          humanReasons: filters.humanReasons || [],
          vehicleReasons: filters.vehicleReasons || [],
          roadSurfaceConditions: filters.roadSurfaceConditions || [],
          equipmentDamages: filters.equipmentDamages || [],

          // Vehicle DTOs Filters
          vehicleColor: filters.vehicleColor || [],
          vehicleSystem: filters.vehicleSystem || [],
          vehiclePlaqueType: filters.vehiclePlaqueType || [],
          vehicleSystemType: filters.vehicleSystemType || [],
          vehicleFaultStatus: filters.vehicleFaultStatus || [],
          vehicleInsuranceCo: filters.vehicleInsuranceCo || [],
          vehiclePlaqueUsage: filters.vehiclePlaqueUsage || [],
          vehicleBodyInsuranceCo: filters.vehicleBodyInsuranceCo || [],
          vehicleMotionDirection: filters.vehicleMotionDirection || [],
          vehicleMaxDamageSections: filters.vehicleMaxDamageSections || [],

          // Driver in Vehicle DTOs Filters
          driverSex: filters.driverSex || [],
          driverLicenceType: filters.driverLicenceType || [],
          driverInjuryType: filters.driverInjuryType || [],
          driverTotalReason: filters.driverTotalReason || [],
        },
        get: {
          series: 1,
        },
      });

      if (result.success) {
        const transformedData = transformData(result.body);
        setChartData(transformedData);
        console.log(result.body);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل ساعتی روز هفته");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
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
      lockToSevereAccidents: false, // Don't lock to severe accidents for time analysis
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="overall" currentChart="hourly-day-of-week" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleFilterSubmit}
              config={getFilterConfig()}
              title="فیلترهای تحلیل ساعتی روز هفته"
              description="برای مشاهده توزیع تصادفات بر اساس ساعت و روز هفته، فیلترهای مورد نظر را اعمال کنید"
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
                <h1 className="text-2xl font-bold text-gray-900">تحلیل ساعتی روز هفته</h1>
                <p className="text-sm text-gray-600 mt-1">
                  نمایش توزیع تصادفات بر اساس ساعت و روز هفته به صورت نمودار حرارتی
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Chart Content */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
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

            {/* Success Message and Stats */}
            {chartData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-500">کل تصادفات</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData.totalAccidents !== undefined
                          ? formatNumber(chartData.totalAccidents)
                          : "0"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-500">ساعت اوج</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData.peakHour || "نامشخص"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-yellow-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-500">روز اوج</div>
                      <div className="text-lg font-bold text-gray-900">
                        {chartData.peakDay || "نامشخص"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-500">میانگین ساعتی</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData.averageHourly !== undefined
                          ? formatNumber(chartData.averageHourly)
                          : "0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">درباره این تحلیل</h3>
                  <p className="text-sm text-blue-700">
                    این نمودار حرارتی توزیع تصادفات را بر اساس ساعت روز و روز هفته نمایش می‌دهد. این
                    تحلیل برای شناسایی الگوهای زمانی تصادفات، ساعات و روزهای پر خطر، و برنامه‌ریزی بهتر
                    منابع امدادی بسیار مفید است.
                  </p>
                </div>
              </div>
            </div>

            {/* Hourly Day of Week Heatmap Chart */}
            <HourlyDayOfWeekHeatmap data={chartData} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HourlyDayOfWeekPage;
