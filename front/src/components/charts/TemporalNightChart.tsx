"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useChartTheme } from "@/utils/chart-theme";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalNightData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalNightChartProps {
  data: TemporalNightData | null;
  isLoading: boolean;
}

const TemporalNightChart: React.FC<TemporalNightChartProps> = ({
  data,
  isLoading,
}) => {
  const chartTheme = useChartTheme();
  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-sunken rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-surface-sunken rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-fg mb-4">
          مقایسه زمانی تصادفات در شب
        </h3>
        <div className="flex items-center justify-center h-64 text-fg-muted">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-fg-faint"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            <p className="text-sm">هیچ داده‌ای برای نمایش وجود ندارد</p>
            <p className="text-xs text-fg-faint mt-1">
              لطفاً فیلترهای مناسب را اعمال کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartOptions = {
    chart: {
      type: "line" as const,
      height: 400,
      fontFamily: "inherit",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
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
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    colors: [chartTheme.warning, chartTheme.faint], // Orange for "با روشنایی کافی", Dark gray for "بدون روشنایی کافی"
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      strokeColors: chartTheme.surface,
      hover: {
        size: 7,
      },
    },
    xaxis: {
      categories: data.categories,
      title: {
        text: "دوره زمانی",
        style: {
          fontSize: "14px",
          fontWeight: 600,
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
        text: "تعداد تصادفات",
        style: {
          fontSize: "14px",
          fontWeight: 600,
          color: chartTheme.label,
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: chartTheme.label,
        },
        formatter: (value: number) => Math.round(value).toString(),
      },
    },
    grid: {
      show: true,
      borderColor: chartTheme.grid,
      strokeDashArray: 0,
      position: "back" as const,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      position: "top" as const,
      horizontalAlign: "right" as const,
      fontSize: "14px",
      fontWeight: 500,
      labels: {
        colors: chartTheme.label,
      },
      markers: {
        size: 12,
        strokeWidth: 0,
      },
    },
    tooltip: {
      theme: chartTheme.mode,
      style: {
        fontSize: "12px",
      },
      x: {
        show: true,
      },
      y: {
        formatter: (
          value: number,
          { seriesIndex }: { seriesIndex: number },
        ) => {
          const seriesName = data.series[seriesIndex]?.name || "نامشخص";
          return `${Math.round(value)} تصادف (${seriesName})`;
        },
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
          },
        },
      },
    ],
  };

  // Calculate statistics
  const totalAccidents = data.series.reduce((acc, series) => {
    return acc + series.data.reduce((sum, val) => sum + val, 0);
  }, 0);

  const wellLitSeries = data.series.find((s) =>
    s.name.includes("نور کافی"),
  );
  const poorlyLitSeries = data.series.find((s) =>
    s.name.includes("نور ناکافی"),
  );

  const wellLitTotal = wellLitSeries
    ? wellLitSeries.data.reduce((sum, val) => sum + val, 0)
    : 0;
  const poorlyLitTotal = poorlyLitSeries
    ? poorlyLitSeries.data.reduce((sum, val) => sum + val, 0)
    : 0;

  const wellLitPercentage =
    totalAccidents > 0 ? Math.round((wellLitTotal / totalAccidents) * 100) : 0;
  const poorlyLitPercentage =
    totalAccidents > 0
      ? Math.round((poorlyLitTotal / totalAccidents) * 100)
      : 0;

  return (
    <div className="bg-surface rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-fg mb-2">
          مقایسه زمانی تصادفات در شب
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-fg-muted">
              با روشنایی کافی: {wellLitTotal.toLocaleString("fa-IR")} (
              {wellLitPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-surface-sunken rounded-full"></div>
            <span className="text-fg-muted">
              بدون روشنایی کافی: {poorlyLitTotal.toLocaleString("fa-IR")} (
              {poorlyLitPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-brand rounded-full"></div>
            <span className="text-fg-muted">
              کل تصادفات: {totalAccidents.toLocaleString("fa-IR")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-fg-muted">
              تعداد دوره‌ها: {data.categories.length.toLocaleString("fa-IR")}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <Chart
          options={chartOptions}
          series={data.series}
          type="line"
          height={400}
        />
      </div>

      {/* Analysis Summary */}
      {totalAccidents > 0 && (
        <div className="mt-6 p-4 bg-canvas rounded-lg">
          <h4 className="font-medium text-fg mb-2">خلاصه تحلیل</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-fg">
            <div>
              <strong>نتیجه کلی:</strong>
              {poorlyLitTotal > wellLitTotal ? (
                <span className="text-danger-fg">
                  {" "}
                  تصادفات در شب بدون روشنایی کافی بیشتر است
                </span>
              ) : wellLitTotal > poorlyLitTotal ? (
                <span className="text-orange-600">
                  {" "}
                  تصادفات در شب با روشنایی کافی بیشتر است
                </span>
              ) : (
                <span className="text-fg-muted">
                  {" "}
                  تصادفات در هر دو حالت تقریباً برابر است
                </span>
              )}
            </div>
            <div>
              <strong>توصیه:</strong>
              {poorlyLitTotal > wellLitTotal ? (
                <span> بهبود روشنایی معابر ضروری است</span>
              ) : (
                <span> بررسی عوامل دیگر مؤثر در تصادفات شبانه</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 text-xs text-fg-muted text-center">
        داده‌ها بر اساس فیلترهای اعمال شده و شرایط روشنایی محل تصادف نمایش داده
        شده‌اند
      </div>
    </div>
  );
};

export default TemporalNightChart;
