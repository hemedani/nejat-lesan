"use client";

import React from "react";
import dynamic from "next/dynamic";

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
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          مقایسه زمانی تصادفات در شب
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
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
            <p className="text-xs text-gray-400 mt-1">
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
    colors: ["#F59E0B", "#1F2937"], // Orange for "با روشنایی کافی", Dark gray for "بدون روشنایی کافی"
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
      strokeColors: "#fff",
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
        formatter: (value: number) => Math.round(value).toString(),
      },
    },
    grid: {
      show: true,
      borderColor: "#E5E7EB",
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
        colors: "#374151",
      },
      markers: {
        size: 12,
        strokeWidth: 0,
      },
    },
    tooltip: {
      theme: "light",
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
    s.name.includes("با روشنایی کافی"),
  );
  const poorlyLitSeries = data.series.find((s) =>
    s.name.includes("بدون روشنایی کافی"),
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          مقایسه زمانی تصادفات در شب
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600">
              با روشنایی کافی: {wellLitTotal.toLocaleString("fa-IR")} (
              {wellLitPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
            <span className="text-gray-600">
              بدون روشنایی کافی: {poorlyLitTotal.toLocaleString("fa-IR")} (
              {poorlyLitPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">
              کل تصادفات: {totalAccidents.toLocaleString("fa-IR")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">
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
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">خلاصه تحلیل</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <strong>نتیجه کلی:</strong>
              {poorlyLitTotal > wellLitTotal ? (
                <span className="text-red-600">
                  {" "}
                  تصادفات در شب بدون روشنایی کافی بیشتر است
                </span>
              ) : wellLitTotal > poorlyLitTotal ? (
                <span className="text-orange-600">
                  {" "}
                  تصادفات در شب با روشنایی کافی بیشتر است
                </span>
              ) : (
                <span className="text-gray-600">
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
      <div className="mt-4 text-xs text-gray-500 text-center">
        داده‌ها بر اساس فیلترهای اعمال شده و شرایط روشنایی محل تصادف نمایش داده
        شده‌اند
      </div>
    </div>
  );
};

export default TemporalNightChart;
