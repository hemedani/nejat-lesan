"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { companyPerformanceAnalytics } from "@/app/actions/accident/companyPerformanceAnalytics";
import { ReqType } from "@/types/declarations/selectInp";
import dynamic from "next/dynamic";

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Get enabled filters for company performance analytics
const ENABLED_FILTERS = getEnabledFiltersForChart(
  "COMPANY_PERFORMANCE_ANALYTICS",
);

// Backend response interface for company performance analytics
interface CompanyPerformanceAnalyticsResponse {
  analytics: Array<{
    companyName: string;
    xAxis: number;
    yAxis: number;
    bubbleSize: number;
    yearDistribution: Array<{
      name: string;
      count: number;
    }>;
  }>;
}

// Demo data for development and fallback
const DEMO_DATA: CompanyPerformanceAnalyticsResponse["analytics"] = [
  {
    companyName: "سایپا",
    xAxis: 0.42,
    yAxis: 1.7,
    bubbleSize: 235,
    yearDistribution: [
      { name: "قبل از ۱۳۷۰", count: 15 },
      { name: "۱۳۷۰-۱۳۸۰", count: 45 },
      { name: "۱۳۸۰-۱۳۹۰", count: 120 },
      { name: "۱۳۹۰-۱۴۰۰", count: 55 },
    ],
  },
  {
    companyName: "ایران خودرو",
    xAxis: 0.38,
    yAxis: 1.85,
    bubbleSize: 280,
    yearDistribution: [
      { name: "قبل از ۱۳۷۰", count: 25 },
      { name: "۱۳۷۰-۱۳۸۰", count: 65 },
      { name: "۱۳۸۰-۱۳۹۰", count: 140 },
      { name: "۱۳۹۰-۱۴۰۰", count: 50 },
    ],
  },
  {
    companyName: "پارس خودرو",
    xAxis: 0.35,
    yAxis: 1.45,
    bubbleSize: 180,
    yearDistribution: [
      { name: "قبل از ۱۳۷۰", count: 5 },
      { name: "۱۳۷۰-۱۳۸۰", count: 25 },
      { name: "۱۳۸۰-۱۳۹۰", count: 95 },
      { name: "۱۳۹۰-۱۴۰۰", count: 55 },
    ],
  },
  {
    companyName: "مدیران خودرو",
    xAxis: 0.28,
    yAxis: 1.25,
    bubbleSize: 150,
    yearDistribution: [
      { name: "قبل از ۱۳۷۰", count: 2 },
      { name: "۱۳۷۰-۱۳۸۰", count: 15 },
      { name: "۱۳۸۰-۱۳۹۰", count: 85 },
      { name: "۱۳۹۰-۱۴۰۰", count: 48 },
    ],
  },
  {
    companyName: "رنو پارس",
    xAxis: 0.25,
    yAxis: 1.1,
    bubbleSize: 120,
    yearDistribution: [
      { name: "قبل از ۱۳۷۰", count: 0 },
      { name: "۱۳۷۰-۱۳۸۰", count: 8 },
      { name: "۱۳۸۰-۱۳۹۰", count: 70 },
      { name: "۱۳۹۰-۱۴۰۰", count: 42 },
    ],
  },
];

// Bubble Chart Component
interface CompanyPerformanceBubbleChartProps {
  data: CompanyPerformanceAnalyticsResponse["analytics"] | null;
  isLoading: boolean;
}

const CompanyPerformanceBubbleChart: React.FC<
  CompanyPerformanceBubbleChartProps
> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="w-12 h-12 animate-spin text-blue-600"
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
            <p className="text-gray-600">در حال بارگذاری نمودار...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 17h4a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h4m2 0a9 9 0 11-8 0"
              />
            </svg>
            <p className="text-gray-600 mb-2">داده‌ای برای نمایش وجود ندارد</p>
            <p className="text-sm text-gray-500">
              لطفاً فیلترهای مختلف را امتحان کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Transform data for ApexCharts bubble series
  const series = data.map((company) => ({
    name: company.companyName,
    data: [
      [
        parseFloat(company.xAxis.toFixed(2)),
        parseFloat(company.yAxis.toFixed(2)),
        company.bubbleSize,
      ],
    ],
  }));

  // Generate colors for each company
  const colors = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Amber
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#84CC16", // Lime
  ];

  const options = {
    chart: {
      type: "bubble" as const,
      height: 500,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
      fontFamily: "inherit",
    },
    colors: colors,
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 0.8,
    },
    title: {
      text: "مقایسه عملکرد کمپانی‌های سازنده خودرو",
      align: "center" as const,
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#1F2937",
      },
    },
    xaxis: {
      title: {
        text: "سهم دارا بودن عامل وسیله نقلیه مؤثر در تصادفات شدید",
        style: {
          fontSize: "14px",
          fontWeight: "600",
          color: "#374151",
        },
      },
      labels: {
        formatter: function (val: string) {
          const numVal = parseFloat(val);
          return numVal.toLocaleString("fa-IR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
      },
    },
    yaxis: {
      title: {
        text: "سهم تصادفات فوتی از تصادفات شدید",
        style: {
          fontSize: "14px",
          fontWeight: "600",
          color: "#374151",
        },
      },
      labels: {
        formatter: function (val: number) {
          return val.toLocaleString("fa-IR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
      },
    },
    tooltip: {
      enabled: true,
      custom: function ({
        seriesIndex,
      }: {
        series: number[][];
        seriesIndex: number;
        dataPointIndex: number;
        w: unknown;
      }) {
        const companyData = data[seriesIndex];
        const totalYears = companyData.yearDistribution.reduce(
          (sum, item) => sum + item.count,
          0,
        );

        // Create a simple pie chart representation in text
        const yearPercentages = companyData.yearDistribution.map((item) => ({
          ...item,
          percentage:
            totalYears > 0 ? ((item.count / totalYears) * 100).toFixed(1) : "0",
        }));

        return `
          <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-64">
            <div class="font-bold text-lg text-gray-900 mb-3 text-center border-b pb-2">
              ${companyData.companyName}
            </div>

            <div class="space-y-2 mb-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">سهم عامل وسیله:</span>
                <span class="font-medium text-blue-600">${companyData.xAxis.toLocaleString("fa-IR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">سهم تصادفات فوتی:</span>
                <span class="font-medium text-red-600">${companyData.yAxis.toLocaleString("fa-IR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">تعداد تصادفات:</span>
                <span class="font-medium text-gray-900">${companyData.bubbleSize.toLocaleString("fa-IR")}</span>
              </div>
            </div>

            <div class="border-t pt-3">
              <div class="text-sm font-medium text-gray-900 mb-2">توزیع سال ساخت:</div>
              <div class="space-y-1">
                ${yearPercentages
                  .map(
                    (item) => `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600">${item.name}:</span>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-900">${item.count.toLocaleString("fa-IR")}</span>
                      <span class="text-gray-500">(${item.percentage}%)</span>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        `;
      },
    },
    legend: {
      show: true,
      position: "bottom" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      markers: {
        size: 12,
        strokeWidth: 0,
        shape: "circle" as const,
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 3,
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="h-[500px]">
        <Chart options={options} series={series} type="bubble" height="100%" />
      </div>
    </div>
  );
};

const CompanyPerformanceAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [chartData, setChartData] = useState<
    CompanyPerformanceAnalyticsResponse["analytics"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<RoadDefectsFilterState>(
    {},
  );

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await companyPerformanceAnalytics({
        set: {
          dateOfAccidentFrom: "",
          dateOfAccidentTo: "",
          province: [],
          city: [],
          road: [],
          lightStatus: [],
          collisionType: [],
          roadSituation: [],
          driverSex: [],
          driverLicenceType: [],
        },
        get: {
          analytics: 1,
        },
      });

      if (result.success && result.body) {
        setChartData(result.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("API failed, using demo data:", result.error);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null); // Clear error when using demo data
      }
    } catch (err) {
      console.warn("Network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(null); // Clear error when using demo data
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter submission
  const handleApplyFilters = async (filters: RoadDefectsFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const filterPayload: ReqType["main"]["accident"]["companyPerformanceAnalytics"]["set"] =
        {
          dateOfAccidentFrom: filters.dateOfAccidentFrom || "",
          dateOfAccidentTo: filters.dateOfAccidentTo || "",
          province: filters.province || [],
          city: filters.city || [],
          road: [],
          lightStatus: filters.lightStatus || [],
          collisionType: filters.collisionType || [],
          roadSituation: [],
          driverSex: [],
          driverLicenceType: [],
        };

      const result = await companyPerformanceAnalytics({
        set: filterPayload,
        get: {
          analytics: 1,
        },
      });

      if (result.success && result.body) {
        setChartData(result.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("Filter API failed, using demo data:", result.error);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null); // Clear error when using demo data
      }
    } catch (err) {
      console.warn("Filter network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(null); // Clear error when using demo data
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
              title="فیلترهای مقایسه عملکرد کمپانی‌ها"
              description="برای مقایسه عملکرد کمپانی‌های مختلف خودروسازی، فیلترهای مورد نظر را اعمال کنید"
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
                  مقایسه عملکرد کمپانی‌های سازنده خودرو
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل مقایسه‌ای کمپانی‌ها بر اساس سهم تصادفات شدید و میزان
                  آسیب‌پذیری در قالب نمودار حبابی
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

          {/* NEW: Standardized Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

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
            {chartData &&
              !isLoading &&
              !isDemoMode &&
              (() => {
                const totalCompanies = chartData.length;
                const totalAccidents = chartData.reduce(
                  (sum, company) => sum + company.bubbleSize,
                  0,
                );
                const avgVehicleFaultShare =
                  chartData.reduce((sum, company) => sum + company.xAxis, 0) /
                  totalCompanies;
                const avgFatalityShare =
                  chartData.reduce((sum, company) => sum + company.yAxis, 0) /
                  totalCompanies;

                return (
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
                      تحلیل {totalCompanies} کمپانی با مجموع{" "}
                      {totalAccidents.toLocaleString("fa-IR")} تصادف - میانگین
                      سهم عامل وسیله: {avgVehicleFaultShare.toFixed(2)}% -
                      میانگین سهم فوتی: {avgFatalityShare.toFixed(2)}%
                    </p>
                  </div>
                );
              })()}

            {/* Bubble Chart */}
            <CompanyPerformanceBubbleChart
              data={chartData}
              isLoading={isLoading}
            />

            {/* Chart Interpretation Guide */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                راهنمای تفسیر نمودار
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">اندازه حباب</h4>
                      <p className="text-sm text-gray-600">
                        تعداد کل تصادفات مربوط به کمپانی را نشان می‌دهد
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        محور عمودی (Y)
                      </h4>
                      <p className="text-sm text-gray-600">
                        سهم تصادفات فوتی از تصادفات شدید - هر چه بالاتر،
                        خطرناک‌تر
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        محور افقی (X)
                      </h4>
                      <p className="text-sm text-gray-600">
                        سهم عامل وسیله نقلیه در تصادفات شدید - هر چه بالاتر،
                        مشکل‌آفرین‌تر
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        توزیع سال ساخت
                      </h4>
                      <p className="text-sm text-gray-600">
                        با کلیک روی هر حباب، توزیع سال ساخت وسایل نقلیه آن
                        کمپانی نمایش داده می‌شود
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistical Summary */}
            {chartData &&
              !isLoading &&
              (() => {
                const totalCompanies = chartData.length;
                const totalAccidents = chartData.reduce(
                  (sum, company) => sum + company.bubbleSize,
                  0,
                );
                const avgVehicleFaultShare =
                  chartData.reduce((sum, company) => sum + company.xAxis, 0) /
                  totalCompanies;
                const avgFatalityShare =
                  chartData.reduce((sum, company) => sum + company.yAxis, 0) /
                  totalCompanies;
                const maxAccidentsCompany = chartData.reduce((max, company) =>
                  company.bubbleSize > max.bubbleSize ? company : max,
                );
                const minAccidentsCompany = chartData.reduce((min, company) =>
                  company.bubbleSize < min.bubbleSize ? company : min,
                );

                return (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      خلاصه آماری
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {totalCompanies.toLocaleString("fa-IR")}
                        </div>
                        <div className="text-sm text-blue-800">
                          تعداد کمپانی‌ها
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {totalAccidents.toLocaleString("fa-IR")}
                        </div>
                        <div className="text-sm text-red-800">
                          مجموع تصادفات
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {avgVehicleFaultShare.toFixed(2)}
                        </div>
                        <div className="text-sm text-green-800">
                          میانگین سهم عامل وسیله
                        </div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">
                          {avgFatalityShare.toFixed(2)}
                        </div>
                        <div className="text-sm text-amber-800">
                          میانگین سهم فوتی
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">
                          بیشترین تصادفات
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">
                            {maxAccidentsCompany.companyName}
                          </span>
                          <span className="font-bold text-gray-900">
                            {maxAccidentsCompany.bubbleSize.toLocaleString(
                              "fa-IR",
                            )}{" "}
                            تصادف
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">
                          کمترین تصادفات
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">
                            {minAccidentsCompany.companyName}
                          </span>
                          <span className="font-bold text-gray-900">
                            {minAccidentsCompany.bubbleSize.toLocaleString(
                              "fa-IR",
                            )}{" "}
                            تصادف
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Company Performance Table */}
            {chartData &&
              !isLoading &&
              (() => {
                const totalCompanies = chartData.length;
                const avgVehicleFaultShare =
                  chartData.reduce((sum, company) => sum + company.xAxis, 0) /
                  totalCompanies;
                const avgFatalityShare =
                  chartData.reduce((sum, company) => sum + company.yAxis, 0) /
                  totalCompanies;

                return (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      جدول عملکرد کمپانی‌ها
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-right py-3 px-4 font-medium text-gray-900">
                              کمپانی
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900">
                              تعداد تصادفات
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900">
                              سهم عامل وسیله (%)
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900">
                              سهم فوتی (%)
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-gray-900">
                              رتبه کلی
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData
                            .sort(
                              (a, b) => a.xAxis + a.yAxis - (b.xAxis + b.yAxis),
                            ) // Sort by combined risk score
                            .map((company, index) => (
                              <tr
                                key={company.companyName}
                                className="border-b border-gray-100 hover:bg-gray-50"
                              >
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  {company.companyName}
                                </td>
                                <td className="py-3 px-4 text-center text-gray-700">
                                  {company.bubbleSize.toLocaleString("fa-IR")}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-1 rounded text-sm font-medium ${
                                      company.xAxis > avgVehicleFaultShare
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {company.xAxis.toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-1 rounded text-sm font-medium ${
                                      company.yAxis > avgFatalityShare
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {company.yAxis.toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                                      index === 0
                                        ? "bg-green-100 text-green-800"
                                        : index === 1
                                          ? "bg-blue-100 text-blue-800"
                                          : index === 2
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {index + 1}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPerformanceAnalyticsPage;
