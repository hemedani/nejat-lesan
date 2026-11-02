"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatNumber } from "@/utils/formatters";
import { useChartTheme } from "@/utils/chart-theme";

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
  const chartTheme = useChartTheme();

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <svg className="w-12 h-12 text-fg-faint animate-spin" fill="none" viewBox="0 0 24 24">
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
            <p className="text-fg-muted">در حال بارگذاری نمودار...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="w-16 h-16 text-fg-faint"
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
              <p className="text-fg-muted font-medium mb-1">داده‌ای برای نمایش وجود ندارد</p>
              <p className="text-fg-faint text-sm">لطفاً فیلترهای مورد نظر را اعمال کنید</p>
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
    },
    title: {
      text: "سهم تصادفات به تفکیک کاربری محل",
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: "600",
        color: chartTheme.fg,
      },
      margin: 20,
    },
    labels: chartLabels,
    series: chartSeries,
    colors: chartTheme.colors,
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
              color: chartTheme.label,
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: "700",
              color: chartTheme.fg,
              formatter: function (val: string) {
                return formatNumber(parseInt(val));
              },
            },
            total: {
              show: true,
              label: "مجموع",
              fontSize: "14px",
              fontWeight: "500",
              color: chartTheme.label,
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
        colors: [chartTheme.onFill],
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
        colors: chartTheme.label,
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
      theme: chartTheme.mode,
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
    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
      <div className="h-96">
        <Chart options={chartOptions} series={chartSeries} type="donut" height="100%" />
      </div>

      {/* Data Summary Table */}
      <div className="mt-6 border-t border-line pt-6">
        <h4 className="text-lg font-semibold text-fg mb-4">جزئیات آماری</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-canvas">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider">
                  کاربری محل
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider">
                  تعداد تصادفات
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider">
                  درصد
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-line">
              {data.map((item, index) => {
                const percentage = ((item.count / totalCount) * 100).toFixed(1);
                return (
                  <tr key={item.name} className={index % 2 === 0 ? "bg-surface" : "bg-canvas"}>
                    <td className="px-4 py-3 text-sm font-medium text-fg">
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
                    <td className="px-4 py-3 text-sm text-fg">{formatNumber(item.count)}</td>
                    <td className="px-4 py-3 text-sm text-fg">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-surface-sunken">
              <tr>
                <td className="px-4 py-3 text-sm font-semibold text-fg">مجموع</td>
                <td className="px-4 py-3 text-sm font-semibold text-fg">
                  {formatNumber(totalCount)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-fg">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AreaUsageChart;
