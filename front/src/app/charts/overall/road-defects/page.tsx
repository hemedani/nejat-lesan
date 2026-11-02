"use client";

import React, { useState } from "react";
import EffectiveRoadDefectsDashboard from "@/components/dashboards/EffectiveRoadDefectsDashboard";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { roadDefectsAnalytics } from "@/app/actions/accident/roadDefectsAnalytics";
import DownloadCSVButton from "@/components/atoms/DownloadCSVButton";
import UnknownDataIndicator from "@/components/atoms/UnknownDataIndicator";
import { excludeUnknown } from "@/utils/chartData";
import { formatNumber } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";

// Backend response interface for road defects analytics
interface RoadDefectsAnalyticsData {
  defectDistribution: {
    withDefect: number;
    withoutDefect: number;
  };
  defectCounts: Array<{
    name: string;
    count: number;
  }>;
  severityBreakdown: Array<{
    severity: string;
    withDefect: number;
    withoutDefect: number;
  }>;
}

const RoadDefectsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();
  // Get enabled filters for road defects analytics considering enterprise settings
  const ENABLED_FILTERS = getEnabledFiltersForChartWithPermissions(
    "ROAD_DEFECTS_ANALYTICS",
    userLevel === "Enterprise" ? enterpriseSettings : undefined,
  );
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [chartData, setChartData] = useState<RoadDefectsAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({
    dateOfAccidentFrom: "2024-03-20T00:00:00.000Z",
    dateOfAccidentTo: "2025-03-19T23:59:59.999Z",
  });

  // Handle filter submission
  const handleFilterSubmit = async (filters: ChartFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);

    try {
      const result = await roadDefectsAnalytics({
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
          airPollutionZone: filters.airPollutionZone || [],
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
          defectDistribution: 1,
          defectCounts: 1,
        },
      });

      if (result.success) {
        setChartData(result.body);
        console.log(result.body);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های نقص راه");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual data loading
  const handleLoadData = async () => {
    await handleFilterSubmit(appliedFilters);
  };

  // Filter configuration
  const getFilterConfig = () => {
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: false,
      lockToSevereAccidents: false, // Allow all accidents, not just severe ones
    };
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Navigation */}
      <ChartNavigation currentSection="overall" currentChart="road-defects" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleFilterSubmit}
              config={getFilterConfig()}
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
                <h1 className="text-2xl font-bold text-fg">تحلیل نقص راه</h1>
                <p className="text-sm text-fg-muted mt-1">
                  تحلیل تفصیلی نقص‌های راه و تأثیر آن بر وقوع تصادفات
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 text-on-brand px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-line-strong disabled:text-fg-muted disabled:cursor-not-allowed transition-colors"
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
                {chartData && (
                  <DownloadCSVButton
                    data={[
                      ...chartData.defectCounts.map((d) => ({
                        type: "defect_count",
                        name: d.name,
                        count: d.count,
                      })),
                      {
                        type: "distribution",
                        name: "دارای نقص مؤثر راه",
                        count: chartData.defectDistribution.withDefect,
                      },
                      {
                        type: "distribution",
                        name: "فاقد نقص مؤثر راه",
                        count: chartData.defectDistribution.withoutDefect,
                      },
                    ]}
                    filename="road-defects-analytics"
                    headers={["type", "name", "count"]}
                    buttonText="دانلود CSV"
                  />
                )}
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-surface-sunken text-fg px-4 py-2 rounded-lg hover:bg-surface-sunken transition-colors"
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

          {/* NEW: Standardized Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Chart Content */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-danger-soft border border-danger-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-danger-fg" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-danger-fg">خطا</h3>
                </div>
                <p className="text-sm text-danger-fg">{error}</p>
              </div>
            )}

            {/* Success Message and Stats */}
            {chartData &&
              (() => {
                const totalAccidents =
                  chartData.defectDistribution.withDefect + chartData.defectDistribution.withoutDefect;
                const defectPercentage =
                  totalAccidents > 0
                    ? ((chartData.defectDistribution.withDefect / totalAccidents) * 100).toFixed(1)
                    : "0.0";
                const mostCommonDefect =
                  excludeUnknown(chartData.defectCounts)[0]?.name ?? "نامشخص";

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-surface rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-brand-soft rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-brand-fg"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-fg-muted">کل تصادفات</div>
                          <div className="text-2xl font-bold text-fg">
                            {formatNumber(totalAccidents)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-danger-soft rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-danger-fg"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-2-6a1 1 0 112 0v4a1 1 0 11-2 0V8z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-fg-muted">نرخ نقص راه</div>
                          <div className="text-2xl font-bold text-fg">
                            {Number(defectPercentage).toLocaleString("fa-IR")}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 tint-warning bg-tint-strong rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-tint-fg"
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
                          <div className="text-sm font-medium text-fg-muted">شایع‌ترین نقص</div>
                          <div className="text-lg font-bold text-fg">{mostCommonDefect}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Unknown Data Indicator */}
            {chartData && (
              <UnknownDataIndicator
                items={chartData.defectCounts}
                title="هشدار: نقص راه نامشخص"
                description={`از مجموع ${formatNumber(
                  chartData.defectCounts.reduce((sum, item) => sum + item.count, 0),
                )} نقص ثبت‌شده، بخشی بدون نوع نقص مشخص ثبت شده‌اند. این موضوع می‌تواند بر دقت تحلیل تأثیر بگذارد.`}
              />
            )}

            {/* Chart Description */}
            <div className="bg-brand-soft border border-brand-border rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-brand-fg" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-brand-fg mb-2">درباره این تحلیل</h3>
                  <p className="text-sm text-brand-fg">
                    این نمودار تحلیل جامعی از نقص‌های راه و تأثیر آن‌ها بر وقوع تصادفات ارائه می‌دهد.
                    شامل توزیع تصادفات با و بدون نقص راه، انواع نقص‌های شایع، و تحلیل بر اساس شدت
                    تصادفات می‌باشد.
                  </p>
                </div>
              </div>
            </div>

            {/* Road Defects Dashboard */}
            <EffectiveRoadDefectsDashboard data={chartData} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadDefectsPage;
