"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface BarChartData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

interface SpatialCollisionBarChartProps {
  data: BarChartData | null;
  isLoading: boolean;
  hidden?: Set<number>;
  onToggle?: (index: number) => void;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#84CC16",
  "#EC4899",
  "#6B7280",
];

const sortData = (
  categories: string[],
  series: Array<{ name: string; data: number[] }>,
  visible: Set<number>,
) => {
  const totals = categories.map((_, ci) => {
    let t = 0;
    for (let si = 0; si < series.length; si++) if (visible.has(si)) t += series[si].data[ci];
    return t;
  });
  const order = totals
    .map((t, i) => ({ t, i }))
    .sort((a, b) => b.t - a.t)
    .map((x) => x.i);
  return {
    categories: order.map((i) => categories[i]),
    series: series.map((s) => ({ name: s.name, data: order.map((i) => s.data[i]) })),
  };
};

const SpatialCollisionBarChart: React.FC<SpatialCollisionBarChartProps> = ({
  data,
  isLoading,
  hidden: externalHidden,
  onToggle,
}) => {
  const [internalHidden, setInternalHidden] = useState<Set<number>>(new Set());
  const effectiveHidden = externalHidden ?? internalHidden;

  const handleToggle = (index: number) => {
    if (onToggle) {
      onToggle(index);
    } else {
      setInternalHidden((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    }
  };

  const displayData = useMemo(() => {
    if (!data || !data.categories || !data.series) return data;
    const filtered = data.series.filter((_, i) => !effectiveHidden.has(i));
    if (filtered.length === 0) return { categories: data.categories, series: [] };
    return sortData(data.categories, filtered, new Set(filtered.map((_, i) => i)));
  }, [data, effectiveHidden]);

  const seriesColors = useMemo(() => {
    if (!data) return COLORS;
    const visible = data.series.map((_, i) => i).filter((i) => !effectiveHidden.has(i));
    if (visible.length === 0) return COLORS;
    return visible.map((i) => COLORS[i % COLORS.length]);
  }, [data, effectiveHidden]);
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!displayData || !displayData.categories || displayData.categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            شمار تصادفات به تفکیک نوع برخورد
          </h3>
        </div>
        <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              داده‌ای موجود نیست
            </h3>
            <p className="text-gray-600">
              برای مشاهده نمودار، فیلترهای مناسب را انتخاب کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total accidents for each category
  const totalAccidents = displayData.categories.map((_, index) => {
    return displayData.series.reduce(
      (sum, series) => sum + (series.data[index] || 0),
      0,
    );
  });

  // Find the category with most accidents
  const maxAccidents = Math.max(...totalAccidents);
  const maxIndex = totalAccidents.indexOf(maxAccidents);
  const topZone = displayData.categories[maxIndex];

  // ApexCharts configuration
  const chartOptions = {
    chart: {
      type: "bar" as const,
      stacked: true,
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
      fontFamily: "vazir-matn, Arial, sans-serif",
      events: {
        legendClick: (_chartContext: unknown, seriesIndex: number) => {
          handleToggle(seriesIndex);
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 4,
        borderRadiusApplication: "end" as const,
        dataLabels: {
          total: {
            enabled: true,
            style: {
              fontSize: "12px",
              fontWeight: 600,
              color: "#374151",
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: displayData.categories,
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 500,
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
      },
    },
    legend: {
      show: true,
      position: "bottom" as const,
      horizontalAlign: "center" as const,
      onItemClick: {
        toggleDataSeries: false,
      },
      labels: {
        colors: "#374151",
        useSeriesColors: false,
      },
      markers: {
        size: 8,
        strokeWidth: 0,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4,
      },
    },
    colors: seriesColors,
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " تصادف";
        },
      },
      style: {
        fontSize: "12px",
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 3,
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: "90%",
            },
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            شمار تصادفات به تفکیک نوع برخورد
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            توزیع انواع برخورد در مناطق مختلف شهر - هر رنگ یک نوع برخورد را نشان می‌دهد
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="w-4 h-4"
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
          {displayData.categories.length} منطقه
        </div>
      </div>

      {/* Legend Toggle Buttons */}
      <div className="flex justify-center gap-2 flex-wrap mb-2">
        {data?.series.map((s, i) => {
          const vis = !effectiveHidden.has(i);
          const c = COLORS[i % COLORS.length];
          return (
            <button
              key={s.name}
              onClick={() => handleToggle(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 select-none ${
                vis
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${vis ? "" : "opacity-30"}`}
                style={{ backgroundColor: c }}
              />
              <span className={vis ? "" : "line-through opacity-50"}>{s.name}</span>
              {!vis && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 text-center mb-4">
        درصد نقشه نسبت به مجموع انواع برخورد قابل مشاهده محاسبه می‌شود
      </p>

      {/* Chart */}
      <div className="h-96 mb-6">
        <Chart
          options={chartOptions}
          series={displayData.series}
          type="bar"
          height="100%"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {displayData.categories.length}
          </div>
          <div className="text-sm text-gray-600">مناطق بررسی شده</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {displayData.series.length}
          </div>
          <div className="text-sm text-gray-600">نوع برخورد</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {totalAccidents.reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-sm text-gray-600">کل تصادفات</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {maxAccidents}
          </div>
          <div className="text-sm text-gray-600">بیشترین تصادف ({topZone})</div>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">راهنمای نمودار میله‌ای انباشته</h4>
        <p className="text-sm text-gray-600 mb-2">
          این نمودار میله‌ای انباشته، توزیع انواع برخورد در مناطق مختلف را نشان می‌دهد. هر میله نمایانگر یک منطقه است و رنگ‌های مختلف روی میله نشان‌دهنده انواع مختلف برخورد در آن منطقه هستند. عدد روی هر میله مجموع کل تصادفات آن منطقه است.
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>هر رنگ نوع برخورد متفاوت را نشان می‌دهد</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>عدد روی هر میله مجموع تصادفات منطقه است</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpatialCollisionBarChart;
