"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useChartTheme } from "@/utils/chart-theme";
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
  const chartTheme = useChartTheme();
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-sunken rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-surface-sunken rounded"></div>
        </div>
      </div>
    );
  }

  // Empty data state
  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-fg mb-4">
          مقایسه زمانی صدمات و نوع برخورد
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-fg-muted">
          <svg
            className="w-16 h-16 mb-4 text-fg-faint"
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
        color: chartTheme.fg,
      },
    },
    xaxis: {
      categories: data.categories,
      title: {
        text: "بازه زمانی",
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          color: chartTheme.label,
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: chartTheme.label,
        },
      },
    },
    yaxis: {
      title: {
        text: "درصد از کل تصادفات",
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          color: chartTheme.label,
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: chartTheme.label,
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
    colors: chartTheme.colors,
    grid: {
      show: true,
      borderColor: chartTheme.grid,
      strokeDashArray: 5,
    },
    legend: {
      show: true,
      position: "bottom" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontWeight: "normal",
      labels: {
        colors: chartTheme.label,
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
    <div className="bg-surface rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-fg">
              مقایسه زمانی صدمات و نوع برخورد
            </h3>
            <p className="text-sm text-fg-muted mt-1">
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
              <div key={index} className="bg-canvas rounded-lg p-3">
                <h4 className="text-sm font-medium text-fg mb-2 truncate">
                  {series.name}
                </h4>
                <div className="space-y-1 text-xs text-fg-muted">
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
