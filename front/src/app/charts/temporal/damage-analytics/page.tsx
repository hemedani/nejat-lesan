"use client";

import React, { useState, useEffect, useCallback } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import TemporalDamageChart from "@/components/charts/TemporalDamageChart";
import { temporalDamageAnalytics } from "@/app/actions/accident/temporalDamageAnalytics";
import { ReqType } from "@/types/declarations/selectInp";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";

interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalDamageData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalDamageResponse {
  body: {
    analytics: TemporalDamageData;
  };
  success: boolean;
}

// Demo data for fallback
const DEMO_DATA: TemporalDamageData = {
  categories: [
    "1401-01",
    "1401-02",
    "1401-03",
    "1401-04",
    "1401-05",
    "1401-06",
    "1401-07",
    "1401-08",
    "1401-09",
    "1401-10",
    "1401-11",
    "1401-12",
  ],
  series: [
    {
      name: "سهم از کل تصادفات",
      data: [
        15.2, 18.7, 12.3, 22.1, 25.8, 19.4, 21.6, 17.9, 14.5, 16.8, 13.2, 20.5,
      ],
    },
  ],
};

// Default max damage sections as specified in requirements
const DEFAULT_MAX_DAMAGE_SECTIONS = [
  "سپر جلو",
  "سپر عقب",
  "درب موتور جلو",
  "چراغ جلو راست",
  "چراغ جلو چپ",
];

const TemporalDamageAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<TemporalDamageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<RoadDefectsFilterState>({
    maxDamageSections: DEFAULT_MAX_DAMAGE_SECTIONS,
  });

  // Load initial data on component mount
  const loadInitialData = useCallback(async () => {
    // Get default filters for initial load
    const getDefaultFilters = (): RoadDefectsFilterState => {
      return {
        province: [],
        city: [],
        dateOfAccidentFrom: undefined,
        dateOfAccidentTo: undefined,
        lightStatus: [],
        collisionType: [],
        roadDefects: [],
        airStatuses: [],
        areaUsages: [],
        roadSurfaceConditions: [],
        maxDamageSections: DEFAULT_MAX_DAMAGE_SECTIONS,
        deadCountMin: undefined,
        deadCountMax: undefined,
        injuredCountMin: undefined,
        injuredCountMax: undefined,
      };
    };

    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const defaultFilters = getDefaultFilters();
      const apiParams: ReqType["main"]["accident"]["temporalDamageAnalytics"]["set"] =
        {
          dateOfAccidentFrom: defaultFilters.dateOfAccidentFrom,
          dateOfAccidentTo: defaultFilters.dateOfAccidentTo,
          province: defaultFilters.province,
          city: defaultFilters.city,
          lightStatus: defaultFilters.lightStatus,
          collisionType: defaultFilters.collisionType,
          maxDamageSections: defaultFilters.maxDamageSections,
          deadCountMin: defaultFilters.deadCountMin,
          deadCountMax: defaultFilters.deadCountMax,
          injuredCountMin: defaultFilters.injuredCountMin,
          injuredCountMax: defaultFilters.injuredCountMax,
        };

      const cleanedParams = Object.fromEntries(
        Object.entries(apiParams).filter(
          ([, value]) =>
            value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalDamageAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalDamageResponse;

      if (response.success && response.body?.analytics) {
        setChartData(response.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn(
          "[TemporalDamageAnalytics] API failed, using demo data:",
          response,
        );
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.error(
        "[TemporalDamageAnalytics] Network error, using demo data:",
        err,
      );
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(
        `Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle manual data loading
  const handleLoadData = async () => {
    await loadInitialData();
  };

  // Handle filter submission
  const handleApplyFilters = async (filterState: RoadDefectsFilterState) => {
    // Store applied filters for display
    setAppliedFilters(filterState);

    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      // Map filter state to API parameters
      const apiParams: ReqType["main"]["accident"]["temporalDamageAnalytics"]["set"] =
        {
          dateOfAccidentFrom: filterState.dateOfAccidentFrom,
          dateOfAccidentTo: filterState.dateOfAccidentTo,
          province: filterState.province,
          city: filterState.city,
          lightStatus: filterState.lightStatus,
          collisionType: filterState.collisionType,
          maxDamageSections: filterState.maxDamageSections,
          deadCountMin: filterState.deadCountMin,
          deadCountMax: filterState.deadCountMax,
          injuredCountMin: filterState.injuredCountMin,
          injuredCountMax: filterState.injuredCountMax,
        };

      // Remove undefined values
      const cleanedParams = Object.fromEntries(
        Object.entries(apiParams).filter(
          ([, value]) =>
            value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalDamageAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalDamageResponse;

      if (response.success && response.body?.analytics) {
        setChartData(response.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("Filter API failed, using demo data:", response);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.warn("Filter network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(null);
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

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Calculate statistics
  const getStatistics = () => {
    if (!chartData || !chartData.series?.[0]?.data) {
      return null;
    }

    const data = chartData.series[0].data;
    const average = data.reduce((sum, val) => sum + val, 0) / data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const maxIndex = data.indexOf(max);
    const minIndex = data.indexOf(min);

    return {
      average: average.toFixed(1),
      max: max.toFixed(1),
      min: min.toFixed(1),
      maxPeriod: chartData.categories?.[maxIndex] || "",
      minPeriod: chartData.categories?.[minIndex] || "",
    };
  };

  const statistics = getStatistics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation
        currentSection="temporal"
        currentChart="damage-analytics"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              title="فیلترهای تحلیل صدمات"
              description="برای مشاهده تحلیل دقیق صدمات، فیلترهای مورد نظر را اعمال کنید"
              initialFilters={{
                province: [],
                city: [],
                dateOfAccidentFrom: undefined,
                dateOfAccidentTo: undefined,
                lightStatus: [],
                collisionType: [],
                roadDefects: [],
                airStatuses: [],
                areaUsages: [],
                roadSurfaceConditions: [],
                maxDamageSections: DEFAULT_MAX_DAMAGE_SECTIONS,
                deadCountMin: undefined,
                deadCountMax: undefined,
                injuredCountMin: undefined,
                injuredCountMax: undefined,
              }}
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
                  مقایسه زمانی صدمات و نوع برخورد
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل درصد سهم صدمات انتخابی از کل تصادفات در بازه‌های زمانی
                  مختلف
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
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <svg
                    className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
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
                  {isLoading ? "در حال بارگذاری..." : "بارگذاری مجدد"}
                </button>
              </div>
            </div>
          </div>

          {/* NEW: Standardized Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Demo Mode Alert */}
          {isDemoMode && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    حالت نمایشی
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    به دلیل عدم دسترسی به API، داده‌های نمونه نمایش داده می‌شود.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">خطا</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  میانگین
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.average}%
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  حداکثر
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.max}%
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  حداقل
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.min}%
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  دوره بالاترین
                </h3>
                <p className="text-lg font-bold text-green-600">
                  {statistics.maxPeriod}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  دوره پایین‌ترین
                </h3>
                <p className="text-lg font-bold text-red-600">
                  {statistics.minPeriod}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <TemporalDamageChart data={chartData} isLoading={isLoading} />

          {/* Info Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-800 mb-3">
              راهنمای تفسیر نمودار
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  این نمودار درصد سهم صدمات انتخابی شده از کل تصادفات در هر بازه
                  زمانی را نمایش می‌دهد
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  بخش‌های آسیب‌دیده پیش‌فرض شامل: سپر جلو، سپر عقب، درب موتور
                  جلو، چراغ جلو راست و چپ
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  می‌توانید بخش‌های آسیب‌دیده دیگری را از طریق فیلتر انتخاب کنید
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  ابزارهای زوم و پان برای بررسی دقیق‌تر نمودار در دسترس است
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalDamageAnalyticsPage;
