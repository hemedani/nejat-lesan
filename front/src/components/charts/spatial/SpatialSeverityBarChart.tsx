"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SpatialSeverityBarChartProps {
  data: {
    categories: string[];
    series: Array<{
      name: string;
      data: number[];
    }>;
  } | null;
  isLoading: boolean;
}

const COLORS = ["#EF4444", "#F59E0B", "#10B981"];

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

const SpatialSeverityBarChart: React.FC<SpatialSeverityBarChartProps> = ({
  data,
  isLoading,
}) => {
  const [hidden, setHidden] = useState<Set<number>>(new Set());

  const displayData = useMemo(() => {
    if (!data || !data.categories || !data.series) return data;
    const filtered = data.series.filter((_, i) => !hidden.has(i));
    if (filtered.length === 0) return { categories: data.categories, series: [] };
    return sortData(data.categories, filtered, new Set(filtered.map((_, i) => i)));
  }, [data, hidden]);

  const seriesColors = useMemo(() => {
    if (!data) return COLORS;
    const visible = data.series.map((_, i) => i).filter((i) => !hidden.has(i));
    if (visible.length === 0) return COLORS;
    return visible.map((i) => COLORS[i % COLORS.length]);
  }, [data, hidden]);

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

  if (!displayData || !displayData.categories || !displayData.series) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          شمار تصادفات به تفکیک شدت
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">داده‌ای برای نمایش موجود نیست</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    chart: {
      type: "bar" as const,
      height: 350,
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
      fontFamily: "inherit",
      animations: {
        enabled: true,
        easing: "easeout" as const,
        speed: 500,
        dynamicAnimation: { enabled: true, speed: 400 },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        dataLabels: {
          total: {
            enabled: true,
            style: {
              fontSize: "12px",
              fontWeight: 600,
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
        },
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
    },
    legend: { show: false },
    fill: {
      opacity: 1,
    },
    colors: seriesColors,
    grid: {
      show: true,
      borderColor: "#e5e7eb",
      strokeDashArray: 0,
      position: "back" as const,
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " تصادف";
        },
      },
    },
  };

  const handleToggle = (index: number) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          شمار تصادفات به تفکیک شدت
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          نمودار ستونی انباشته
        </div>
      </div>

      <div className="flex justify-center gap-2 flex-wrap mb-4">
        {data?.series.map((s, i) => {
          const vis = !hidden.has(i);
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

      <div className="mt-4">
        <Chart
          options={chartOptions}
          series={displayData.series}
          type="bar"
          height={350}
        />
      </div>

      {/* Chart Legend/Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
          <p className="font-semibold mb-1">نحوه تحلیل نمودار ستونی:</p>
          <p>این نمودار تعداد تصادفات را بر اساس شدت (فوتی، جرحی، خسارتی) در هر منطقه نشان می‌دهد. برای تحلیل:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>مناطق با ستون‌های قرمز بلند = نقاط پرخطر با تصادفات فوتی بالا</li>
            <li>مقایسه ارتفاع ستون‌ها بین مناطق مختلف برای اولویت‌بندی مداخلات ایمنی</li>
            <li>مناطقی که سهم خسارتی در آن‌ها بالاست نسبتاً ایمن‌تر محسوب می‌شوند</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpatialSeverityBarChart;
