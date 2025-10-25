"use client";

import React, { useState, useEffect, useCallback } from "react";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import TemporalTotalReasonChart from "@/components/charts/TemporalTotalReasonChart";
import { temporalTotalReasonAnalytics } from "@/app/actions/accident/temporalTotalReasonAnalytics";
import { ReqType } from "@/types/declarations/selectInp";

// Interface for chart series
interface ChartSeries {
  name: string;
  data: number[];
}

// Interface for temporal total reason data
interface TemporalTotalReasonData {
  categories: string[];
  series: ChartSeries[];
}

// Get enabled filters for temporal total reason analytics
const ENABLED_FILTERS = getEnabledFiltersForChart(
  "TEMPORAL_TOTAL_REASON_ANALYTICS",
);

// Interface for API response structure
interface ApiResponseData {
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

// Demo data for development and fallback
const DEMO_DATA: TemporalTotalReasonData = {
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
      name: "عدم رعایت حق تقدم",
      data: [42, 38, 45, 41, 39, 44, 46, 43, 40, 47, 45, 42],
    },
    {
      name: "سرعت غیرمجاز",
      data: [35, 32, 38, 36, 34, 39, 41, 37, 33, 40, 38, 35],
    },
    {
      name: "عدم حفظ فاصله",
      data: [28, 25, 31, 29, 27, 32, 34, 30, 26, 33, 31, 28],
    },
    {
      name: "تغییر مسیر ناگهانی",
      data: [22, 19, 25, 23, 21, 26, 28, 24, 20, 27, 25, 22],
    },
    {
      name: "رانندگی در حالت خواب‌آلودگی",
      data: [18, 15, 21, 19, 17, 22, 24, 20, 16, 23, 21, 18],
    },
    {
      name: "عدم توجه به علائم راهنمایی",
      data: [15, 12, 18, 16, 14, 19, 21, 17, 13, 20, 18, 15],
    },
    {
      name: "رانندگی در مسیر مخالف",
      data: [12, 9, 15, 13, 11, 16, 18, 14, 10, 17, 15, 12],
    },
    {
      name: "نقص فنی وسیله نقلیه",
      data: [8, 5, 11, 9, 7, 12, 14, 10, 6, 13, 11, 8],
    },
    {
      name: "شرایط جوی نامساعد",
      data: [6, 3, 9, 7, 5, 10, 12, 8, 4, 11, 9, 6],
    },
    {
      name: "نقص در روشنایی جاده",
      data: [4, 1, 7, 5, 3, 8, 10, 6, 2, 9, 7, 4],
    },
  ],
};

const DEFAULT_FILTER_STATE: ChartFilterState = {
  province: [],
  city: [],
  dateOfAccidentFrom: undefined,
  dateOfAccidentTo: undefined,
  lightStatus: [],
  collisionType: [],
  roadDefects: [],
  roadSurfaceConditions: [],
  humanReasons: [],
  vehicleSystem: [],
  driverSex: [],
  driverLicenceType: [],
};

const TemporalTotalReasonAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<TemporalTotalReasonData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<ChartFilterState>(DEFAULT_FILTER_STATE);
  const [activeReasons, setActiveReasons] = useState<string[]>([]);

  // Load initial data on component mount
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const apiParams: ReqType["main"]["accident"]["temporalTotalReasonAnalytics"]["set"] =
        {
          dateOfAccidentFrom: "",
          dateOfAccidentTo: "",
          province: [],
          city: [],
          road: [],
          lightStatus: [],
          collisionType: [],
          roadSituation: [],
          roadSurfaceConditions: [],
          humanReasons: [],
          roadDefects: [],
          vehicleSystem: [],
          driverSex: [],
          driverLicenceType: [],
        };

      const response = await temporalTotalReasonAnalytics({
        set: apiParams,
        get: { analytics: 1 },
      });

      if (response.success && response.body?.analytics) {
        // Transform the response to temporal format
        const temporalData = transformToTemporalFormat(response.body.analytics);
        setChartData(temporalData);
        setActiveReasons(
          temporalData.series.length > 0 ? [temporalData.series[0].name] : [],
        );
        setIsDemoMode(false);
      } else {
        console.warn(
          "[TemporalTotalReasonAnalytics] API failed, using demo data:",
          response,
        );
        setChartData(DEMO_DATA);
        setActiveReasons([DEMO_DATA.series[0].name]);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.error(
        "[TemporalTotalReasonAnalytics] Network error, using demo data:",
        err,
      );
      setChartData(DEMO_DATA);
      setActiveReasons([DEMO_DATA.series[0].name]);
      setIsDemoMode(true);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Transform API response to temporal format
  const transformToTemporalFormat = (
    analyticsData: ApiResponseData,
  ): TemporalTotalReasonData => {
    try {
      // Check if the response has the expected structure
      if (
        analyticsData &&
        analyticsData.categories &&
        analyticsData.series &&
        Array.isArray(analyticsData.categories) &&
        Array.isArray(analyticsData.series)
      ) {
        return {
          categories: analyticsData.categories,
          series: analyticsData.series.map(
            (series: { name: string; data: number[] }) => ({
              name: series.name || "نامشخص",
              data: Array.isArray(series.data) ? series.data : [],
            }),
          ),
        };
      } else {
        console.warn(
          "[TemporalTotalReasonAnalytics] Invalid API response structure, using demo data",
        );
        return DEMO_DATA;
      }
    } catch (error) {
      console.error(
        "[TemporalTotalReasonAnalytics] Error transforming API data:",
        error,
      );
      return DEMO_DATA;
    }
  };

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle filter submission
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const filterPayload: ReqType["main"]["accident"]["temporalTotalReasonAnalytics"]["set"] =
        {
          dateOfAccidentFrom: filters.dateOfAccidentFrom || "",
          dateOfAccidentTo: filters.dateOfAccidentTo || "",
          province: filters.province || [],
          city: filters.city || [],
          road: [],
          lightStatus: filters.lightStatus || [],
          collisionType: filters.collisionType || [],
          roadSituation: [],
          roadSurfaceConditions: filters.roadSurfaceConditions || [],
          humanReasons: filters.humanReasons || [],
          roadDefects: filters.roadDefects || [],
          vehicleSystem: filters.vehicleSystem || [],
          driverSex: filters.driverSex || [],
          driverLicenceType: filters.driverLicenceType || [],
        };

      const response = await temporalTotalReasonAnalytics({
        set: filterPayload,
        get: { analytics: 1 },
      });

      if (response.success && response.body?.analytics) {
        const temporalData = transformToTemporalFormat(response.body.analytics);
        setChartData(temporalData);
        setActiveReasons(
          temporalData.series.length > 0 ? [temporalData.series[0].name] : [],
        );
        setAppliedFilters(filters);
        setIsDemoMode(false);
      } else {
        console.warn(
          "[TemporalTotalReasonAnalytics] Filter API failed, using demo data:",
          response,
        );
        setChartData(DEMO_DATA);
        setActiveReasons([DEMO_DATA.series[0].name]);
        setAppliedFilters(filters);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.warn(
        "[TemporalTotalReasonAnalytics] Filter network error, using demo data:",
        err,
      );
      setChartData(DEMO_DATA);
      setActiveReasons([DEMO_DATA.series[0].name]);
      setAppliedFilters(filters);
      setIsDemoMode(true);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual data loading
  const handleLoadData = async () => {
    await loadInitialData();
  };

  // Handle active reasons change
  const handleActiveReasonsChange = (newActiveReasons: string[]) => {
    setActiveReasons(newActiveReasons);
  };

  // Get dynamic checkbox filter configuration
  const getDynamicCheckboxFilter = () => {
    if (!chartData || !chartData.series) return undefined;

    return {
      title: "انتخاب علل برای نمایش",
      options: chartData.series.map((series) => series.name),
      activeOptions: activeReasons,
      onChange: handleActiveReasonsChange,
    };
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
        currentSection="temporal"
        currentChart="total-reason-analytics"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل زمانی علت تامه"
              description="برای مشاهده روند زمانی علت تامه تصادفات، فیلترهای مورد نظر را اعمال کنید"
              dynamicCheckboxFilter={getDynamicCheckboxFilter()}
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
                  مقایسه زمانی علت تامه تصادفات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند زمانی ۱۰ علت برتر تصادفات و مقایسه آن‌ها در طول
                  زمان
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
          <AppliedFiltersDisplay filters={appliedFilters} />

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
            {chartData && !isLoading && !isDemoMode && (
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
                  تحلیل زمانی علت تامه تصادفات با {chartData.series.length} علت
                  برتر شناسایی شده - دوره زمانی: {chartData.categories.length}{" "}
                  دوره
                </p>
              </div>
            )}

            {/* Temporal Chart */}
            <TemporalTotalReasonChart
              data={chartData}
              isLoading={isLoading}
              activeReasons={activeReasons}
            />

            {/* Statistical Summary */}
            {chartData && chartData.series.length > 0 && !isLoading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  خلاصه آماری
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {chartData.series.length}
                    </div>
                    <div className="text-sm text-blue-800">
                      تعداد علل شناسایی شده
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {activeReasons.length}
                    </div>
                    <div className="text-sm text-green-800">علل انتخاب شده</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {chartData.categories.length}
                    </div>
                    <div className="text-sm text-purple-800">دوره زمانی</div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {chartData.series.reduce(
                        (total, series) =>
                          total +
                          series.data.reduce((sum, value) => sum + value, 0),
                        0,
                      )}
                    </div>
                    <div className="text-sm text-amber-800">مجموع تصادفات</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalTotalReasonAnalyticsPage;
