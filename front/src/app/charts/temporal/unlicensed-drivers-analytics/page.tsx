"use client";

import React, { useState, useEffect, useCallback } from "react";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { temporalUnlicensedDriversAnalytics } from "@/app/actions/accident/temporalUnlicensedDriversAnalytics";
import { ReqType } from "@/types/declarations/selectInp";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Types for the API response
interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalUnlicensedDriversData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalUnlicensedDriversResponse {
  body: {
    analytics: TemporalUnlicensedDriversData;
  };
  success: boolean;
}

// Get enabled filters for temporal unlicensed drivers analytics
const ENABLED_FILTERS = getEnabledFiltersForChart(
  "TEMPORAL_UNLICENSED_DRIVERS_ANALYTICS",
);

// Chart component
interface TemporalUnlicensedDriversChartProps {
  data: TemporalUnlicensedDriversData | null;
  isLoading: boolean;
}

const TemporalUnlicensedDriversChart: React.FC<
  TemporalUnlicensedDriversChartProps
> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600">هیچ داده‌ای برای نمایش وجود ندارد</p>
            <p className="text-sm text-gray-500 mt-1">
              لطفاً فیلترهای مناسب را انتخاب کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartOptions = {
    chart: {
      type: "line" as const,
      height: 400,
      fontFamily: "inherit",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    title: {
      text: "مقایسه زمانی کاربران فاقد گواهینامه معتبر",
      align: "center" as const,
      style: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#1f2937",
      },
    },
    xaxis: {
      categories: data.categories,
      title: {
        text: "دوره زمانی",
        style: {
          fontSize: "14px",
          fontWeight: "500",
          color: "#6b7280",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
      },
    },
    yaxis: {
      title: {
        text: "تعداد تصادفات",
        style: {
          fontSize: "14px",
          fontWeight: "500",
          color: "#6b7280",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
      },
    },
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    colors: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"],
    grid: {
      show: true,
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: function (val: number) {
          return val + " تصادف";
        },
      },
    },
    legend: {
      position: "top" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontWeight: 500,
      markers: {
        size: 12,
        strokeWidth: 0,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: "bottom" as const,
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <Chart
        options={chartOptions}
        series={data.series}
        type="line"
        height={400}
      />
    </div>
  );
};

// Main page component
const TemporalUnlicensedDriversAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] =
    useState<TemporalUnlicensedDriversData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

  // Load initial data on component mount
  const loadInitialData = useCallback(async () => {
    const getDefaultFilters = (): ChartFilterState => {
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
        vehicleMaxDamageSections: [],
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
      const apiParams: ReqType["main"]["accident"]["temporalUnlicensedDriversAnalytics"]["set"] =
        {
          dateOfAccidentFrom: defaultFilters.dateOfAccidentFrom,
          dateOfAccidentTo: defaultFilters.dateOfAccidentTo,
          province: defaultFilters.province,
          city: defaultFilters.city,
          lightStatus: defaultFilters.lightStatus,
          collisionType: defaultFilters.collisionType,
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

      const response = (await temporalUnlicensedDriversAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalUnlicensedDriversResponse;

      if (response.success && response.body) {
        setChartData(response.body.analytics);
        setAppliedFilters(defaultFilters);
      } else {
        setError("خطا در دریافت داده‌ها");
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("خطا در بارگذاری داده‌ها");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle filter application
  const handleApplyFilters = async (filterState: ChartFilterState) => {
    setIsLoading(true);
    setError(null);
    setChartData(null);
    setAppliedFilters(filterState);

    try {
      const apiParams: ReqType["main"]["accident"]["temporalUnlicensedDriversAnalytics"]["set"] =
        {
          dateOfAccidentFrom: filterState.dateOfAccidentFrom,
          dateOfAccidentTo: filterState.dateOfAccidentTo,
          province: filterState.province,
          city: filterState.city,
          lightStatus: filterState.lightStatus,
          collisionType: filterState.collisionType,
          deadCountMin: filterState.deadCountMin,
          deadCountMax: filterState.deadCountMax,
          injuredCountMin: filterState.injuredCountMin,
          injuredCountMax: filterState.injuredCountMax,
        };

      const cleanedParams = Object.fromEntries(
        Object.entries(apiParams).filter(
          ([, value]) =>
            value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalUnlicensedDriversAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalUnlicensedDriversResponse;

      if (response.success && response.body) {
        setChartData(response.body.analytics);
      } else {
        setError("خطا در دریافت داده‌ها");
      }
    } catch (err) {
      console.error("Error applying filters:", err);
      setError("خطا در اعمال فیلترها");
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
        currentSection="temporal"
        currentChart="unlicensed-drivers-analytics"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل رانندگان بدون گواهینامه"
              description="برای تحلیل تصادفات رانندگان بدون گواهینامه، فیلترهای مورد نظر را اعمال کنید"
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
                  مقایسه زمانی کاربران فاقد گواهینامه معتبر
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند زمانی تصادفات ناشی از رانندگان فاقد گواهینامه معتبر
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

          {/* Content */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-600"
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
                  <span className="text-red-800 font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Chart */}
            <TemporalUnlicensedDriversChart
              data={chartData}
              isLoading={isLoading}
            />

            {/* Analysis Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                📊 درباره این تحلیل
              </h3>
              <p className="text-blue-800 text-sm">
                این نمودار روند زمانی تصادفات ناشی از رانندگان فاقد گواهینامه
                معتبر را نشان می‌دهد. این تحلیل به شناسایی الگوهای زمانی و
                روندهای تصادفات مرتبط با عدم داشتن گواهینامه کمک می‌کند.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalUnlicensedDriversAnalyticsPage;
