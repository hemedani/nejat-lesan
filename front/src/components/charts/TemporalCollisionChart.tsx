"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalCollisionData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalCollisionChartProps {
  data: TemporalCollisionData | null;
  isLoading: boolean;
  error?: string | null;
  isDemoMode?: boolean;
}

const TemporalCollisionChart: React.FC<TemporalCollisionChartProps> = ({
  data,
  isLoading,
  error,
  isDemoMode = false,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isDemoMode) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            خطا در بارگذاری داده‌ها
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Empty data state
  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            داده‌ای موجود نیست
          </h3>
          <p className="text-gray-600">
            برای مشاهده نمودار، لطفاً فیلترهای مناسب را اعمال کنید.
          </p>
        </div>
      </div>
    );
  }

  // Chart configuration
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
      text: "مقایسه زمانی نحوه و نوع برخورد",
      align: "center" as const,
      style: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#1f2937",
      },
    },
    subtitle: {
      text: isDemoMode ? "(داده‌های نمونه)" : "",
      align: "center" as const,
      style: {
        fontSize: "12px",
        color: "#6b7280",
      },
    },
    xaxis: {
      categories: data.categories,
      title: {
        text: "دوره زمانی",
        style: {
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
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
        text: "درصد سهم (%)",
        style: {
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
        },
      },
      labels: {
        formatter: function (value: number) {
          return value.toFixed(1) + "%";
        },
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
      },
      min: 0,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (value: number) {
          return value.toFixed(2) + "%";
        },
      },
      style: {
        fontSize: "12px",
      },
    },
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    markers: {
      size: 5,
      hover: {
        size: 7,
      },
    },
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    grid: {
      show: true,
      borderColor: "#e5e7eb",
      strokeDashArray: 3,
    },
    legend: {
      position: "bottom" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontWeight: "500",
      itemMargin: {
        horizontal: 15,
        vertical: 5,
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
            itemMargin: {
              horizontal: 10,
              vertical: 3,
            },
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Demo Mode Warning */}
      {isDemoMode && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-sm font-medium text-yellow-800">
              در حال نمایش داده‌های نمونه
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="w-full">
        <Chart
          options={chartOptions}
          series={data.series}
          type="line"
          height={400}
        />
      </div>

      {/* Chart Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          توضیحات نمودار
        </h4>
        <p className="text-xs text-gray-600">
          این نمودار سهم درصدی انواع مختلف برخورد را در طول زمان نمایش می‌دهد.
          هر خط نمایانگر یک نوع برخورد خاص است و تغییرات آن در دوره‌های زمانی
          مختلف را نشان می‌دهد.
        </p>
      </div>
    </div>
  );
};

export default TemporalCollisionChart;
