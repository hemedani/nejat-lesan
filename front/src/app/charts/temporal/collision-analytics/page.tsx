"use client";

import React, { useState, useEffect, useCallback } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import TemporalCollisionChart from "@/components/charts/TemporalCollisionChart";
import { temporalCollisionAnalytics } from "@/app/actions/accident/temporalCollisionAnalytics";
import { ReqType } from "@/types/declarations/selectInp";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";

// Type alias for temporal collision analytics API parameters
type TemporalCollisionApiParams =
  ReqType["main"]["accident"]["temporalCollisionAnalytics"]["set"];

// Get enabled filters for temporal collision analytics
const ENABLED_FILTERS = getEnabledFiltersForChart(
  "TEMPORAL_COLLISION_ANALYTICS",
);

interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalCollisionData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalCollisionResponse {
  body: {
    analytics: TemporalCollisionData;
  };
  success: boolean;
}

// Demo data for fallback
const DEMO_DATA: TemporalCollisionData = {
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
        25.3, 28.1, 22.7, 31.4, 29.8, 26.2, 33.1, 27.9, 24.5, 30.2, 28.7, 32.1,
      ],
    },
  ],
};

// Default collision types as specified in requirements
const DEFAULT_COLLISION_TYPES = [
  "برخورد وسیله نقلیه با شیء ثابت",
  "واژگونی و سقوط",
  "خروج از جاده",
  "برخورد وسیله نقلیه با یک وسیله نقلیه",
];

const TemporalCollisionAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<TemporalCollisionData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({
    collisionType: DEFAULT_COLLISION_TYPES,
  });

  // Load initial data on component mount
  const loadInitialData = useCallback(async () => {
    // Get default filters for initial load
    const getDefaultFilters = (): ChartFilterState => {
      return {
        province: [],
        city: [],
        dateOfAccidentFrom: undefined,
        dateOfAccidentTo: undefined,
        lightStatus: [],
        collisionType: DEFAULT_COLLISION_TYPES,
        roadDefects: [],
        airStatuses: [],
        areaUsages: [],
        roadSurfaceConditions: [],
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
      const apiParams: TemporalCollisionApiParams = {
        dateOfAccidentFrom: defaultFilters.dateOfAccidentFrom,
        dateOfAccidentTo: defaultFilters.dateOfAccidentTo,
        province: defaultFilters.province,
        city: defaultFilters.city,
        lightStatus: defaultFilters.lightStatus,
        collisionType: defaultFilters.collisionType,
        roadDefects: defaultFilters.roadDefects,
        airStatuses: defaultFilters.airStatuses,
        areaUsages: defaultFilters.areaUsages,
        roadSurfaceConditions: defaultFilters.roadSurfaceConditions,
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

      const response = (await temporalCollisionAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalCollisionResponse;

      if (response.success && response.body?.analytics) {
        setChartData(response.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn(
          "[TemporalCollisionAnalytics] API failed, using demo data:",
          response,
        );
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.error(
        "[TemporalCollisionAnalytics] Network error, using demo data:",
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

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle filter application
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setIsLoading(true);
    setError(null);
    setChartData(null);
    setAppliedFilters(filters);

    try {
      const apiParams: TemporalCollisionApiParams = {
        dateOfAccidentFrom: filters.dateOfAccidentFrom,
        dateOfAccidentTo: filters.dateOfAccidentTo,
        province: filters.province,
        city: filters.city,
        lightStatus: filters.lightStatus,
        collisionType: filters.collisionType,
        roadDefects: filters.roadDefects,
        airStatuses: filters.airStatuses,
        areaUsages: filters.areaUsages,
        roadSurfaceConditions: filters.roadSurfaceConditions,
        deadCountMin: filters.deadCountMin,
        deadCountMax: filters.deadCountMax,
        injuredCountMin: filters.injuredCountMin,
        injuredCountMax: filters.injuredCountMax,
      };

      const cleanedParams = Object.fromEntries(
        Object.entries(apiParams).filter(
          ([, value]) =>
            value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalCollisionAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalCollisionResponse;

      if (response.success && response.body?.analytics) {
        setChartData(response.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn(
          "[TemporalCollisionAnalytics] API failed, using demo data:",
          response,
        );
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.error(
        "[TemporalCollisionAnalytics] Network error, using demo data:",
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
        currentChart="collision-analytics"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل برخورد"
              description="برای مشاهده تحلیل زمانی نحوه و نوع برخورد، فیلترهای مورد نظر را اعمال کنید"
              initialFilters={{
                collisionType: DEFAULT_COLLISION_TYPES,
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
                  مقایسه زمانی نحوه و نوع برخورد
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند زمانی انواع مختلف برخورد و مقایسه آن‌ها در بازه‌های
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
              </div>
            </div>
          </div>

          {/* NEW: Standardized Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Chart */}
          <div className="space-y-6">
            <TemporalCollisionChart
              data={chartData}
              isLoading={isLoading}
              error={error}
              isDemoMode={isDemoMode}
            />

            {/* Chart Statistics */}
            {chartData && chartData.series && chartData.series.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  آمار کلی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {chartData.categories.length}
                    </div>
                    <div className="text-sm text-blue-700">دوره زمانی</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {chartData.series.length}
                    </div>
                    <div className="text-sm text-green-700">سری داده</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {chartData.series
                        .reduce(
                          (total, series) =>
                            total +
                            series.data.reduce((sum, value) => sum + value, 0),
                          0,
                        )
                        .toFixed(1)}
                      %
                    </div>
                    <div className="text-sm text-purple-700">مجموع سهم</div>
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

export default TemporalCollisionAnalyticsPage;
