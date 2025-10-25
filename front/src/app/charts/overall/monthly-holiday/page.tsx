"use client";

import React, { useState, useEffect } from "react";
import MonthlyHolidayAnalyticsDashboard from "@/components/dashboards/MonthlyHolidayAnalyticsDashboard";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { monthlyHolidayAnalytics } from "@/app/actions/accident/monthlyHolidayAnalytics";

// Get enabled filters for monthly holiday analytics
const ENABLED_FILTERS = getEnabledFiltersForChart("MONTHLY_HOLIDAY_ANALYTICS");

// Backend response interface for monthly holiday analytics
interface MonthlyHolidayAnalyticsData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

const MonthlyHolidayPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [chartData, setChartData] =
    useState<MonthlyHolidayAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await monthlyHolidayAnalytics({
        set: {
          lightStatus: [],
          collisionType: [],
          dateOfAccidentFrom: "",
          dateOfAccidentTo: "",
        },
        get: {
          categories: 1,
          series: 1,
        },
      });

      if (result.success) {
        setChartData(result.body);
      } else {
        setError(
          result.error || "خطا در بارگذاری داده‌های تحلیل ماهانه تعطیلات",
        );
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter submission
  const handleFilterSubmit = async (filters: ChartFilterState) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await monthlyHolidayAnalytics({
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
          categories: 1,
          series: 1,
        },
      });

      if (result.success) {
        setChartData(result.body);
      } else {
        setError(
          result.error || "خطا در بارگذاری داده‌های تحلیل ماهانه تعطیلات",
        );
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
      lockToSevereAccidents: false, // No specific lock for holiday analysis
    };
  };

  // Calculate statistics
  const getStatistics = () => {
    if (!chartData || !chartData.series || !chartData.categories) return null;

    const holidaySeries = chartData.series.find((s) => s.name === "تعطیل");
    const nonHolidaySeries = chartData.series.find(
      (s) => s.name === "غیر تعطیل",
    );

    if (!holidaySeries && !nonHolidaySeries) return null;

    const totalHolidayAccidents =
      holidaySeries?.data.reduce((sum, val) => sum + val, 0) || 0;
    const totalNonHolidayAccidents =
      nonHolidaySeries?.data.reduce((sum, val) => sum + val, 0) || 0;

    const totalAccidents = totalHolidayAccidents + totalNonHolidayAccidents;
    const holidayPercentage =
      totalAccidents > 0
        ? ((totalHolidayAccidents / totalAccidents) * 100).toFixed(1)
        : "0";

    // Find month with highest holiday accidents
    const maxIndex = holidaySeries
      ? holidaySeries.data.indexOf(Math.max(...holidaySeries.data))
      : -1;
    const peakMonth =
      maxIndex !== -1 ? chartData.categories[maxIndex] : "نامشخص";

    return {
      totalHolidayAccidents,
      totalNonHolidayAccidents,
      totalAccidents,
      holidayPercentage,
      peakMonth,
    };
  };

  const statistics = getStatistics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation
        currentSection="overall"
        currentChart="monthly-holiday"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleFilterSubmit}
              config={getFilterConfig()}
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
                  تحلیل ماهانه تعطیلات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  مقایسه تصادفات در روزهای تعطیل و غیرتعطیل به تفکیک ماه
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

          {/* Chart Content */}
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

            {/* Success Message and Stats */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-500">
                        کل تصادفات
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {statistics.totalAccidents.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-500">
                        تصادفات تعطیل
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {statistics.totalHolidayAccidents.toLocaleString()}
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
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-500">
                        نرخ تعطیلات
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {statistics.holidayPercentage}%
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
                            d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-500">
                        ماه اوج
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {statistics.peakMonth}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Description */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-green-800 mb-2">
                    درباره این تحلیل
                  </h3>
                  <p className="text-sm text-green-700">
                    این نمودار تحلیل ماهانه تصادفات در روزهای تعطیل و غیرتعطیل
                    را نمایش می‌دهد. این تحلیل به شناسایی الگوهای فصلی و تأثیر
                    تعطیلات بر نرخ تصادفات کمک می‌کند. اطلاعات ارائه شده شامل
                    مقایسه تصادفات در ماه‌های مختلف سال و تفکیک بین روزهای تعطیل
                    و کاری است.
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Holiday Dashboard */}
            <MonthlyHolidayAnalyticsDashboard
              data={chartData}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyHolidayPage;
