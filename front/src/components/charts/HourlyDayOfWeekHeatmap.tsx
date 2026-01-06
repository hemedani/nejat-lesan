"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatNumber } from "@/utils/formatters";

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Props interface
interface HourlyDayOfWeekHeatmapProps {
  data: {
    series: Array<{
      name: string;
      data: Array<{
        x: string;
        y: number;
      }>;
    }>;
  } | null;
  isLoading: boolean;
}

const HourlyDayOfWeekHeatmap: React.FC<HourlyDayOfWeekHeatmapProps> = ({ data, isLoading }) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <svg className="w-12 h-12 animate-spin text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
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
          <p className="text-gray-600 text-lg font-medium">در حال بارگذاری نمودار...</p>
          <p className="text-gray-500 text-sm mt-2">لطفاً صبر کنید</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
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
          <p className="text-gray-600 text-lg font-medium mb-2">داده‌ای برای نمایش وجود ندارد</p>
          <p className="text-gray-500 text-sm text-center">
            لطفاً فیلترهای مناسب را انتخاب کرده و دوباره تلاش کنید
          </p>
        </div>
      </div>
    );
  }

  // Generate hour categories (0-23)
  const hourCategories = Array.from({ length: 24 }, (_, i) => i.toString());

  // ApexCharts configuration for heatmap
  const chartOptions: ApexOptions = {
    chart: {
      type: "heatmap",
      height: 500,
      fontFamily: "inherit",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          pan: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          reset: false,
        },
      },
    },
    title: {
      text: "شمار تصادفات به تفکیک ساعت - روز هفته",
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#1f2937",
      },
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 0,
              name: `بدون تصادف (${formatNumber(0)}-${formatNumber(0)})`,
              color: "#f3f4f6",
            },
            {
              from: 1,
              to: 50,
              name: `کم (${formatNumber(1)}-${formatNumber(50)})`,
              color: "#fef3c7",
            },
            {
              from: 51,
              to: 100,
              name: `متوسط (${formatNumber(51)}-${formatNumber(100)})`,
              color: "#fcd34d",
            },
            {
              from: 101,
              to: 200,
              name: `زیاد (${formatNumber(101)}-${formatNumber(200)})`,
              color: "#f59e0b",
            },
            {
              from: 201,
              to: 500,
              name: `خیلی زیاد (${formatNumber(201)}-${formatNumber(500)})`,
              color: "#dc2626",
            },
            {
              from: 501,
              to: 1000,
              name: `بسیار زیاد (${formatNumber(501)}-${formatNumber(1000)})`,
              color: "#991b1b",
            },
          ],
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ["#000000"],
        fontSize: "10px",
        fontWeight: "normal",
      },
      formatter: function (val) {
        if (Array.isArray(val)) {
          const firstValue = val[0];
          const numericFirstValue =
            typeof firstValue === "number" ? firstValue : Number(firstValue) || 0;
          return formatNumber(numericFirstValue);
        }

        const numericValue = typeof val === "number" ? val : Number(val) || 0;
        return formatNumber(numericValue);
      },
    },
    xaxis: {
      type: "category",
      categories: hourCategories.map((hour) => formatNumber(parseInt(hour))),
      title: {
        text: "ساعت",
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          color: "#4b5563",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
        formatter: function (val) {
          // Convert the value to a number first, then format it as Persian digits
          const numericVal = Number(val);
          // Check if the conversion resulted in a valid number
          if (isNaN(numericVal)) {
            // If not a valid number, return the original value
            return val;
          }
          return formatNumber(numericVal);
        },
      },
    },
    yaxis: {
      title: {
        text: "روز هفته",
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          color: "#4b5563",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
      },
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const dayName = w.globals.seriesNames[seriesIndex] || "نامشخص";
        const hour = `${formatNumber(dataPointIndex)}:${formatNumber(0)}${formatNumber(0)}`;
        const value = series[seriesIndex][dataPointIndex] || 0;

        return `
          <div class="bg-white p-3 border border-gray-200 rounded-lg shadow-lg" dir="rtl">
            <div class="font-semibold text-gray-800 mb-1">${dayName}</div>
            <div class="text-sm text-gray-600 mb-1">ساعت: ${hour}</div>
            <div class="text-sm">
              <span class="text-blue-600 font-medium">تعداد تصادفات: </span>
              <span class="font-bold">${formatNumber(value)}</span>
            </div>
          </div>
        `;
      },
    },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      markers: {
        size: 16,
      },
    },
    grid: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Chart Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              نمودار حرارتی تصادفات بر اساس ساعت و روز هفته
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              نمایش توزیع تصادفات در طول ساعات مختلف روز برای هر روز هفته
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>نمودار حرارتی</span>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <div className="w-full" dir="ltr">
          <Chart options={chartOptions} series={data.series} type="heatmap" height={500} />
        </div>
      </div>

      {/* Chart Description */}
      <div className="p-6 border-t border-gray-100 bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">نحوه تفسیر نمودار</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• هر خانه نشان‌دهنده تعداد تصادفات در ساعت مشخص از روز مشخص است</li>
              <li>
                • رنگ‌های روشن‌تر نشان‌دهنده تعداد تصادفات کمتر و رنگ‌های تیره‌تر نشان‌دهنده تعداد
                بیشتر هستند
              </li>
              <li>• برای مشاهده جزئیات هر خانه، نشانگر موس را روی آن قرار دهید</li>
              <li>• این نمودار برای شناسایی الگوهای زمانی تصادفات مفید است</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HourlyDayOfWeekHeatmap;
