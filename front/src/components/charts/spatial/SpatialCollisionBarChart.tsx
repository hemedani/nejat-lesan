"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface BarChartData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

interface SpatialCollisionBarChartProps {
  data: BarChartData | null;
  isLoading: boolean;
}

const SpatialCollisionBarChart: React.FC<SpatialCollisionBarChartProps> = ({
  data,
  isLoading,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            شمار تصادفات به تفکیک نوع برخورد
          </h3>
        </div>
        <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              داده‌ای موجود نیست
            </h3>
            <p className="text-gray-600">
              برای مشاهده نمودار، فیلترهای مناسب را انتخاب کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total accidents for each category
  const totalAccidents = data.categories.map((_, index) => {
    return data.series.reduce(
      (sum, series) => sum + (series.data[index] || 0),
      0,
    );
  });

  // Find the category with most accidents
  const maxAccidents = Math.max(...totalAccidents);
  const maxIndex = totalAccidents.indexOf(maxAccidents);
  const topZone = data.categories[maxIndex];

  // ApexCharts configuration
  const chartOptions = {
    chart: {
      type: "bar" as const,
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
      fontFamily: "vazir-matn, Arial, sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 4,
        borderRadiusApplication: "end" as const,
        dataLabels: {
          total: {
            enabled: true,
            style: {
              fontSize: "12px",
              fontWeight: 600,
              color: "#374151",
            },
          },
        },
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
          fontWeight: 500,
          colors: "#6B7280",
        },
      },
    },
    yaxis: {
      title: {
        text: "تعداد تصادفات",
        style: {
          fontSize: "14px",
          fontWeight: 600,
          color: "#374151",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6B7280",
        },
      },
    },
    legend: {
      position: "top" as const,
      horizontalAlign: "right" as const,
      floating: false,
      offsetY: -10,
      labels: {
        colors: "#374151",
      },
      markers: {
        size: 6,
        strokeWidth: 0,
        shape: "circle" as const,
      },
    },
    colors: [
      "#3B82F6", // Blue
      "#10B981", // Green
      "#F59E0B", // Yellow
      "#EF4444", // Red
      "#8B5CF6", // Purple
      "#06B6D4", // Cyan
      "#F97316", // Orange
      "#84CC16", // Lime
      "#EC4899", // Pink
      "#6B7280", // Gray
    ],
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " تصادف";
        },
      },
      style: {
        fontSize: "12px",
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 3,
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: "90%",
            },
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            شمار تصادفات به تفکیک نوع برخورد
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            توزیع انواع برخورد در مناطق مختلف شهر
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          {data.categories.length} منطقه
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 mb-6">
        <Chart
          options={chartOptions}
          series={data.series}
          type="bar"
          height="100%"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {data.categories.length}
          </div>
          <div className="text-sm text-gray-600">مناطق بررسی شده</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {data.series.length}
          </div>
          <div className="text-sm text-gray-600">نوع برخورد</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {totalAccidents.reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-sm text-gray-600">کل تصادفات</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {maxAccidents}
          </div>
          <div className="text-sm text-gray-600">بیشترین تصادف ({topZone})</div>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">راهنمای نمودار</h4>
        <p className="text-sm text-gray-600 mb-2">
          این نمودار میله‌ای انباشته، توزیع انواع برخورد در مناطق مختلف را نشان
          می‌دهد.
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>هر رنگ نوع برخورد متفاوت را نشان می‌دهد</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>عدد روی هر میله مجموع تصادفات منطقه است</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpatialCollisionBarChart;
