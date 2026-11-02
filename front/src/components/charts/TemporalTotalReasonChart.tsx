"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { UNKNOWN_LABEL } from "@/utils/chartData";
import { useChartTheme } from "@/utils/chart-theme";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalTotalReasonData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalTotalReasonChartProps {
  data: TemporalTotalReasonData | null;
  isLoading: boolean;
  activeReasons: string[];
}

const TemporalTotalReasonChart: React.FC<TemporalTotalReasonChartProps> = ({
  data,
  isLoading,
  activeReasons,
}) => {
  const chartTheme = useChartTheme();
  // Filter series based on activeReasons
  const visibleSeries = useMemo(() => {
    if (!data || !data.series) return [];
    return data.series.filter(
      (series) => series.name !== UNKNOWN_LABEL && activeReasons.includes(series.name),
    );
  }, [data, activeReasons]);

  // Chart configuration
  const chartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: "line",
      height: 450,
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
      fontFamily: "inherit",
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
    xaxis: {
      categories: data?.categories || [],
      title: {
        text: "دوره زمانی",
        style: {
          fontSize: "14px",
          fontWeight: 600,
        },
      },
      labels: {
        style: {
          fontSize: "12px",
        },
      },
      axisBorder: {
        show: true,
        color: chartTheme.axisLine,
      },
      axisTicks: {
        show: true,
        color: chartTheme.axisLine,
      },
    },
    yaxis: {
      title: {
        text: "تعداد تصادفات",
        style: {
          fontSize: "14px",
          fontWeight: 600,
        },
      },
      labels: {
        style: {
          fontSize: "12px",
        },
        formatter: (value: number) => Math.round(value).toLocaleString("fa-IR"),
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      style: {
        fontSize: "12px",
      },
      x: {
        show: true,
        format: "dd/MM/yy",
      },
      y: {
        formatter: (value: number) => `${value.toLocaleString("fa-IR")} مورد`,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "center",
      fontSize: "12px",
      fontWeight: 500,
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    grid: {
      show: true,
      borderColor: chartTheme.grid,
      strokeDashArray: 2,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    colors: chartTheme.colors,
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 350,
          },
          legend: {
            position: "bottom",
          },
          xaxis: {
            labels: {
              rotate: -45,
            },
          },
        },
      },
    ],
  }), [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-fg-muted">در حال بارگذاری نمودار...</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-fg-faint mx-auto mb-4"
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
            <p className="text-fg-muted">داده‌ای برای نمایش موجود نیست</p>
            <p className="text-sm text-fg-muted mt-2">
              لطفاً فیلترهای مناسب را انتخاب کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No visible series state
  if (visibleSeries.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-fg-faint mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <p className="text-fg-muted">هیچ علتی برای نمایش انتخاب نشده</p>
            <p className="text-sm text-fg-muted mt-2">
              از فیلتر کناری حداقل یک علت را انتخاب کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
      {/* Chart Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-fg">
          مقایسه زمانی علت تامه تصادفات
        </h2>
        <p className="text-sm text-fg-muted mt-1">
          روند تغییرات علل اصلی تصادفات در طول زمان
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-fg-muted">
            نمایش {visibleSeries.length} از {data.series.length} علت
          </span>
          <span className="text-xs text-fg-faint">•</span>
          <span className="text-xs text-fg-muted">
            {data.categories.length} دوره زمانی
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        <Chart
          options={chartOptions}
          series={visibleSeries}
          type="line"
          height={450}
        />
      </div>

      {/* Chart Footer */}
      <div className="mt-4 pt-4 border-t border-line">
        <div className="flex flex-wrap items-center gap-4 text-xs text-fg-muted">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span>دوره: {data.categories[0]} تا {data.categories[data.categories.length - 1]}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>مجموع علل: {data.series.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalTotalReasonChart;
