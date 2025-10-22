"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Interface for the data structure
interface MonthlyHolidayAnalyticsData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

// Props interface
interface MonthlyHolidayAnalyticsDashboardProps {
  data: MonthlyHolidayAnalyticsData | null;
  isLoading: boolean;
}

const MonthlyHolidayAnalyticsDashboard: React.FC<
  MonthlyHolidayAnalyticsDashboardProps
> = ({ data, isLoading }) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            شمار تصادفات روزهای تعطیل / غیرتعطیل به تفکیک ماه
          </h2>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="w-8 h-8 animate-spin text-blue-600"
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
            <p className="text-gray-600">در حال بارگذاری داده‌ها...</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            شمار تصادفات روزهای تعطیل / غیرتعطیل به تفکیک ماه
          </h2>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              داده‌ای یافت نشد
            </h3>
            <p className="text-gray-600">
              برای این بازه زمانی و فیلترهای انتخاب شده، داده‌ای موجود نیست.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total accidents for summary
  const totalHolidayAccidents =
    data.series
      .find((s) => s.name === "تعطیل")
      ?.data.reduce((sum, val) => sum + val, 0) || 0;
  const totalNonHolidayAccidents =
    data.series
      .find((s) => s.name === "غیر تعطیل")
      ?.data.reduce((sum, val) => sum + val, 0) || 0;
  const totalAccidents = totalHolidayAccidents + totalNonHolidayAccidents;
  const holidayPercentage =
    totalAccidents > 0
      ? ((totalHolidayAccidents / totalAccidents) * 100).toFixed(1)
      : "0";

  // ApexCharts configuration for stacked bar chart
  const chartOptions = {
    chart: {
      type: "bar" as const,
      height: 400,
      stacked: true,
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
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: data.categories,
      labels: {
        style: {
          fontSize: "12px",
          colors: "#374151",
        },
      },
    },
    yaxis: {
      title: {
        text: "تعداد تصادفات",
        style: {
          fontSize: "14px",
          color: "#374151",
        },
      },
      labels: {
        style: {
          colors: "#374151",
        },
      },
    },
    colors: ["#EF4444", "#10B981"], // Red for Holiday, Green for Non-Holiday
    legend: {
      position: "top" as const,
      horizontalAlign: "right" as const,
      labels: {
        colors: "#374151",
      },
      markers: {
        size: 4,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val: number) {
          return val + " تصادف";
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            شمار تصادفات روزهای تعطیل / غیرتعطیل به تفکیک ماه
          </h2>
          <p className="text-sm text-gray-600">
            مقایسه آماری تصادفات در روزهای تعطیل و غیرتعطیل طی ماه‌های مختلف سال
          </p>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z" />
          </svg>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            <h3 className="text-sm font-medium text-gray-700">کل تصادفات</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalAccidents.toLocaleString("fa-IR")}
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h3 className="text-sm font-medium text-red-700">روزهای تعطیل</h3>
          </div>
          <p className="text-2xl font-bold text-red-900">
            {totalHolidayAccidents.toLocaleString("fa-IR")}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="text-sm font-medium text-green-700">
              روزهای غیرتعطیل
            </h3>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {totalNonHolidayAccidents.toLocaleString("fa-IR")}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <h3 className="text-sm font-medium text-blue-700">نرخ تعطیلات</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {holidayPercentage}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <Chart
          options={chartOptions}
          series={data.series}
          type="bar"
          height="100%"
        />
      </div>

      {/* Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          تحلیل و بینش
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-blue-800">نکته کلیدی</span>
            </div>
            <p className="text-blue-700">
              {holidayPercentage}% از کل تصادفات در روزهای تعطیل رخ داده‌اند که
              نشان‌دهنده
              {parseFloat(holidayPercentage) > 20
                ? " نرخ بالای"
                : " نرخ متعارف"}{" "}
              تصادفات در این روزها است.
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-amber-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-amber-800">توصیه ایمنی</span>
            </div>
            <p className="text-amber-700">
              در ماه‌هایی با تصادفات بالا در روزهای تعطیل، تدابیر ویژه کنترل
              ترافیک و آگاهی‌رسانی ضروری است.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyHolidayAnalyticsDashboard;
