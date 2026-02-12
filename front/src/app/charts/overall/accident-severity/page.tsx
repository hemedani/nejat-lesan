"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { accidentSeverityAnalytics } from "@/app/actions/accident/accidentSeverityAnalytics";
import AccidentSeverityChart from "@/components/dashboards/charts/AccidentSeverityChart";
import { useAuth } from "@/context/AuthContext";

// Backend response interface for accident severity analytics
interface AccidentSeverityResponse {
  analytics: Array<{
    name: string;
    count: number;
  }>;
}

const AccidentSeverityPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();
  // Get enabled filters for accident severity analytics considering enterprise settings
  const ENABLED_FILTERS = getEnabledFiltersForChartWithPermissions(
    "ACCIDENT_SEVERITY_ANALYTICS",
    userLevel === "Enterprise" ? enterpriseSettings : undefined,
  );
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [chartData, setChartData] = useState<AccidentSeverityResponse["analytics"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDamageFilterActive, setIsDamageFilterActive] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    // By default, include damage-only accidents (show all three types)
    setIsDamageFilterActive(true);

    try {
      // Initial load with empty filters
      const result = await accidentSeverityAnalytics({
        set: {}, // Pass empty set for initial load
        get: {
          analytics: 1,
        },
      });

      if (result.success && result.body) {
        setChartData(result.body.analytics);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های شدت تصادفات");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter submission
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);
    setChartData(null);

    // Check if damage filter is active based on severity constraints
    // If no minimum death/injury counts are set (or they are 0), include damage-only accidents
    // This means showing all three types (Fatal, Injury, Damage) in the chart
    const noMinimumDeathCount = !filters.deadCountMin || filters.deadCountMin === 0;
    const noMinimumInjuryCount = !filters.injuredCountMin || filters.injuredCountMin === 0;
    const damageActive = noMinimumDeathCount && noMinimumInjuryCount;

    setIsDamageFilterActive(damageActive);

    try {
      const result = await accidentSeverityAnalytics({
        set: filters, // Pass all filters directly
        get: {
          analytics: 1,
        },
      });

      if (result.success && result.body) {
        setChartData(result.body.analytics);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های شدت تصادفات");
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
      lockToSevereAccidents: false,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="overall" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              title="فیلترهای شدت تصادفات"
              description="برای مشاهده تحلیل دقیق سهم شدت تصادفات، فیلترهای مورد نظر را اعمال کنید"
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
                <h1 className="text-2xl font-bold text-gray-900">سهم شدت تصادفات</h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل جامع توزیع شدت تصادفات شامل فوتی، جرحی و خسارتی
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

          {/* Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Status Messages */}
          <div className="space-y-4">
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

            {/* Success Message */}
            {chartData && !isLoading && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-green-800">داده‌ها بارگذاری شد</h3>
                </div>
                <p className="text-sm text-green-700">
                  تحلیل شدت تصادفات با {chartData.length} نوع شدت بارگذاری شد
                  {isDamageFilterActive ? " (شامل تصادفات خسارتی)" : " (فقط تصادفات فوتی و جرحی)"}
                </p>
              </div>
            )}

            {/* Chart Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <h4 className="font-medium mb-1">نحوه نمایش نمودار:</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>
                      اگر حداقل تعداد فوتی یا جرحی تنظیم شده باشد: فقط نسبت تصادفات فوتی و جرحی نمایش
                      داده می‌شود
                    </li>
                    <li>
                      اگر هیچ حداقل تعداد تنظیم نشده باشد: نسبت هر سه نوع (فوتی، جرحی، خسارتی) نمایش
                      داده می‌شود
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Accident Severity Chart */}
            <AccidentSeverityChart
              data={chartData}
              isLoading={isLoading}
              isDamageActive={isDamageFilterActive}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccidentSeverityPage;
