"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatNumber } from "@/utils/formatters";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AreaUsageData {
  name: string;
  count: number;
}

interface AreaUsageChartProps {
  data: AreaUsageData[] | null;
  isLoading: boolean;
}

const AreaUsageChart: React.FC<AreaUsageChartProps> = ({ data, isLoading }) => {
  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <svg className="w-12 h-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
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
            <p className="text-gray-500">در حال بارگذاری نمودار...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="w-16 h-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <div className="text-center">
              <p className="text-gray-500 font-medium mb-1">داده‌ای برای نمایش وجود ندارد</p>
              <p className="text-gray-400 text-sm">لطفاً فیلترهای مورد نظر را اعمال کنید</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total count for percentages
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  // Prepare chart data
  const chartSeries = data.map((item) => item.count);
  const chartLabels = data.map((item) => item.name);

  // Chart configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      height: 400,
      fontFamily: "inherit",
      toolbar: {
        show: false,
      },
    },
    title: {
      text: "سهم تصادفات به تفکیک کاربری محل",
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#1f2937",
      },
      margin: 20,
    },
    labels: chartLabels,
    series: chartSeries,
    colors: [
      "#3b82f6", // Blue
      "#ef4444", // Red
      "#10b981", // Green
      "#f59e0b", // Amber
      "#8b5cf6", // Purple
      "#06b6d4", // Cyan
      "#f97316", // Orange
      "#84cc16", // Lime
      "#ec4899", // Pink
      "#6b7280", // Gray
    ],
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: "700",
              color: "#1f2937",
              formatter: function (val: string) {
                return formatNumber(parseInt(val));
              },
            },
            total: {
              show: true,
              label: "مجموع",
              fontSize: "14px",
              fontWeight: "500",
              color: "#6b7280",
              formatter: function () {
                return formatNumber(totalCount);
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%";
      },
      style: {
        fontSize: "12px",
        fontWeight: "600",
        colors: ["#ffffff"],
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.8,
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "14px",
      fontWeight: "400",
      labels: {
        colors: "#374151",
      },
      markers: {
        size: 12,
        strokeWidth: 0,
        shape: "square",
      },
      itemMargin: {
        horizontal: 12,
        vertical: 8,
      },
    },
    tooltip: {
      enabled: true,
      theme: "light",
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: function (val: number) {
          const percentage = ((val / totalCount) * 100).toFixed(1);
          return `${formatNumber(val)} مورد (${percentage}%)`;
        },
      },
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
            horizontalAlign: "center",
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="h-96">
        <Chart options={chartOptions} series={chartSeries} type="donut" height="100%" />
      </div>

      {/* Data Summary Table */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">جزئیات آماری</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  کاربری محل
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تعداد تصادفات
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  درصد
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => {
                const percentage = ((item.count / totalCount) * 100).toFixed(1);
                return (
                  <tr key={item.name} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{
                            backgroundColor: chartOptions.colors?.[index % chartOptions.colors.length],
                          }}
                        ></div>
                        {item.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(item.count)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">مجموع</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  {formatNumber(totalCount)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AreaUsageChart;
