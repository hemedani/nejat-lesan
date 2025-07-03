"use client";

import React from "react";
import dynamic from "next/dynamic";
// ApexCharts types will be inferred

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalDamageData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalDamageChartProps {
  data: TemporalDamageData | null;
  isLoading: boolean;
}

const TemporalDamageChart: React.FC<TemporalDamageChartProps> = ({
  data,
  isLoading,
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

  // Empty data state
  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          مقایسه زمانی صدمات و نوع برخورد
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg
            className="w-16 h-16 mb-4 text-gray-300"
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
          <p className="text-center">
            داده‌ای برای نمایش یافت نشد
            <br />
            لطفاً فیلترهای مناسب را اعمال کنید
          </p>
        </div>
      </div>
    );
  }

  // Chart configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartOptions: any = {
    chart: {
      type: "line" as const,
      height: 400,
      fontFamily: "Vazirmatn, sans-serif",
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
      text: "مقایسه زمانی صدمات و نوع برخورد",
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#1f2937",
      },
    },
    xaxis: {
      categories: data.categories,
      title: {
        text: "بازه زمانی",
        style: {
          fontSize: "14px",
          fontWeight: "bold",
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
        text: "درصد از کل تصادفات",
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          color: "#374151",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
        formatter: (value: number) => {
          return `${value.toFixed(1)}%`;
        },
      },
      min: 0,
      max: 100,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 6,
      hover: {
        size: 8,
      },
    },
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
    grid: {
      show: true,
      borderColor: "#e5e7eb",
      strokeDashArray: 5,
    },
    legend: {
      show: true,
      position: "bottom" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontWeight: "normal",
      labels: {
        colors: "#374151",
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: (value: number) => {
          return `${value.toFixed(2)}%`;
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          title: {
            style: {
              fontSize: "16px",
            },
          },
          legend: {
            position: "bottom" as const,
            fontSize: "12px",
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              مقایسه زمانی صدمات و نوع برخورد
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              درصد سهم صدمات انتخابی از کل تصادفات در بازه‌های زمانی مختلف
            </p>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <Chart
          options={chartOptions}
          series={data.series}
          type="line"
          height={400}
        />
      </div>

      {/* Chart Statistics */}
      {data.series && data.series.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.series.map((series, index) => {
            const seriesData = series.data;
            const average =
              seriesData.reduce((sum, val) => sum + val, 0) / seriesData.length;
            const max = Math.max(...seriesData);
            const min = Math.min(...seriesData);

            return (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 truncate">
                  {series.name}
                </h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>میانگین:</span>
                    <span className="font-medium">{average.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حداکثر:</span>
                    <span className="font-medium">{max.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حداقل:</span>
                    <span className="font-medium">{min.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TemporalDamageChart;
