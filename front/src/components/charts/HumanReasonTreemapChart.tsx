"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatNumber } from "@/utils/formatters";
import { excludeUnknown } from "@/utils/chartData";
import { useChartTheme } from "@/utils/chart-theme";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface HumanReasonData {
  name: string;
  count: number;
}

interface HumanReasonTreemapChartProps {
  data: HumanReasonData[] | null;
  isLoading: boolean;
}

const HumanReasonTreemapChart: React.FC<HumanReasonTreemapChartProps> = ({ data, isLoading }) => {
  const chartTheme = useChartTheme();

  // Transform data for ApexCharts treemap format
  const transformDataForTreemap = (apiData: HumanReasonData[]) => {
    if (!apiData || apiData.length === 0) return [];

    const chartSeriesData = apiData.map((item) => ({
      x: item.name,
      y: item.count,
    }));

    return [{ data: chartSeriesData }];
  };

  // Chart configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: "treemap",
      height: 500,
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
      fontFamily: "inherit",
    },

    title: {
      text: "توزیع عامل انسانی مؤثر در تصادفات",
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: chartTheme.fg,
        fontFamily: "inherit",
      },
      margin: 20,
    },
    plotOptions: {
      treemap: {
        enableShades: true,
        shadeIntensity: 0.5,
        reverseNegativeShade: true,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 15,
              color: "#dbeafe",
            },
            {
              from: 16,
              to: 35,
              color: "#93c5fd",
            },
            {
              from: 36,
              to: 70,
              color: "#60a5fa",
            },
            {
              from: 71,
              to: 120,
              color: "#3b82f6",
            },
            {
              from: 121,
              to: 200,
              color: "#2563eb",
            },
            {
              from: 201,
              to: 1000,
              color: "#1d4ed8",
            },
          ],
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
        fontWeight: "bold",
        colors: ["#000"],
        fontFamily: "inherit",
      },
      formatter: function (text: string, op: { value: number }) {
        if (op.value < 15) return [text]; // Don't show small values
        return [text, formatNumber(op.value)];
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: true,
      custom: function ({ seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        const percentage = ((data.y / w.globals.seriesTotals[0]) * 100).toFixed(1);
        return `
          <div class="bg-surface p-4 rounded-lg shadow-lg border border-line" dir="rtl" style="font-family: inherit;">
            <div class="font-semibold text-fg mb-2 text-base">${data.x}</div>
            <div class="space-y-1">
              <div class="text-sm text-fg-muted">تعداد: <span class="font-medium text-brand-fg">${formatNumber(data.y)}</span> مورد</div>
              <div class="text-sm text-fg-muted">درصد: <span class="font-medium text-success-fg">${formatNumber(Number(percentage))} %</span></div>
            </div>
          </div>
        `;
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 450,
          },
          dataLabels: {
            style: {
              fontSize: "11px",
            },
          },
        },
      },
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 400,
          },
          title: {
            style: {
              fontSize: "16px",
            },
          },
          dataLabels: {
            style: {
              fontSize: "10px",
            },
          },
        },
      },
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 350,
          },
          title: {
            style: {
              fontSize: "14px",
            },
          },
          dataLabels: {
            enabled: false,
          },
        },
      },
    ],
  };

  const filteredData = excludeUnknown(data);
  const series = filteredData.length > 0 ? transformDataForTreemap(filteredData) : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-sunken rounded w-3/4 mx-auto mb-6"></div>
          <div className="h-96 bg-surface-sunken rounded"></div>
        </div>
        <div className="flex items-center justify-center mt-4">
          <svg className="w-6 h-6 animate-spin text-brand-fg" fill="none" viewBox="0 0 24 24">
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
          <span className="mr-2 text-fg-muted">در حال بارگذاری نمودار...</span>
        </div>
      </div>
    );
  }

  // Empty data state
  if (!data || data.length === 0 || filteredData.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-fg-faint mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <h3 className="text-lg font-medium text-fg mb-2">داده‌ای یافت نشد</h3>
          <p className="text-fg-muted">
            برای مشاهده نمودار توزیع عامل انسانی مؤثر در تصادفات، لطفاً فیلترهای مناسب را اعمال کنید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-brand rounded-full"></div>
            <span className="text-sm font-medium text-fg-muted">
              {formatNumber(filteredData.length)} عامل انسانی برتر شناسایی شده
            </span>
          </div>
          <div className="text-sm text-fg-muted">
            مجموع: {formatNumber(filteredData.reduce((sum, item) => sum + item.count, 0))} مورد
          </div>
        </div>
        <div className="text-xs text-fg-muted">
          اندازه هر مربع متناسب با تعداد وقایع آن عامل انسانی می‌باشد
        </div>
      </div>

      <div className="w-full">
        <Chart options={chartOptions} series={series} type="treemap" height={500} />
      </div>

      {/* Legend and Statistics */}
      <div className="mt-6 space-y-4">
        {/* All Causes Ranked */}
        <div className="p-4 bg-brand-soft rounded-lg">
          <h4 className="text-sm font-medium text-brand-fg mb-3">همه علل (به ترتیب فراوانی)</h4>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {[...filteredData]
              .sort((a, b) => b.count - a.count)
              .map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-brand-soft/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-on-brand ${
                        index === 0 ? 'bg-red-500' :
                        index === 1 ? 'bg-orange-400' :
                        index === 2 ? 'bg-amber-400' :
                        'bg-line text-fg-muted'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm text-blue-900 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-brand-fg flex-shrink-0" dir="ltr">
                    {formatNumber(item.count)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Color Legend */}
        <div className="p-4 bg-canvas rounded-lg">
          <h4 className="text-sm font-medium text-fg mb-3">راهنمای رنگ‌ها بر اساس تعداد:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-line"
                style={{ backgroundColor: "#dbeafe" }}
              ></div>
              <span>۱-۱۵ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-line"
                style={{ backgroundColor: "#93c5fd" }}
              ></div>
              <span>۱۶-۳۵ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-line"
                style={{ backgroundColor: "#60a5fa" }}
              ></div>
              <span>۳۶-۷۰ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-line"
                style={{ backgroundColor: "#3b82f6" }}
              ></div>
              <span>۷۱-۱۲۰ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-line"
                style={{ backgroundColor: "#2563eb" }}
              ></div>
              <span>۱۲۱-۲۰۰ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-line"
                style={{ backgroundColor: "#1d4ed8" }}
              ></div>
              <span>۲۰۱+ مورد</span>
            </div>
          </div>
        </div>

        {/* Human Factor Categories */}
        <div className="p-4 bg-warning-soft rounded-lg">
          <h4 className="text-sm font-medium text-amber-800 mb-3">دسته‌بندی عوامل انسانی:</h4>
          <div className="text-xs text-warning-fg space-y-1">
            <div>
              • <strong>رفتاری:</strong> عدم رعایت حق تقدم، سرعت غیرمجاز، تغییر مسیر ناگهانی
            </div>
            <div>
              • <strong>فیزیولوژیک:</strong> خستگی، خواب‌آلودگی، مصرف مواد
            </div>
            <div>
              • <strong>توجه:</strong> استفاده از تلفن، عدم توجه به علائم
            </div>
            <div>
              • <strong>فنی:</strong> عدم حفظ فاصله ایمنی، نحوه رانندگی
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanReasonTreemapChart;
