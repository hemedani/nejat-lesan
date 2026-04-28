"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SpatialLightBarChartProps {
  data: {
    categories: string[];
    series: Array<{
      name: string;
      data: number[];
    }>;
  } | null;
  isLoading: boolean;
}

const SpatialLightBarChart: React.FC<SpatialLightBarChartProps> = ({ data, isLoading }) => {
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

  if (!data || !data.categories || !data.series) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          شمار تصادفات به تفکیک وضعیت روشنایی
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
      categories: data.categories || [],
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
    legend: {
      position: "top" as const,
      horizontalAlign: "center" as const,
      fontSize: "12px",
    },
    fill: {
      opacity: 1,
    },
    colors: ["#F59E0B", "#3B82F6", "#1E40AF", "#F97316", "#DC2626", "#8B5CF6", "#10B981"],
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">شمار تصادفات به تفکیک وضعیت روشنایی</h3>
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

      <div className="mt-4">
        <Chart options={chartOptions} series={data.series} type="bar" height={350} />
      </div>

      {/* Chart Analysis Guide */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
          <p className="font-semibold mb-1">نحوه تحلیل نمودار ستونی:</p>
          <p>
            این نمودار تعداد تصادفات را بر اساس وضعیت روشنایی (روز، شب، طلوع و غروب آفتاب) در هر منطقه
            نشان می‌دهد:
          </p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>ستون‌های زرد بلند = تصادفات روز بالا (مناطق با روشنایی کافی و شرایط ایمن)</li>
            <li>ستون‌های آبی تیره بلند = تصادفات شب بالا (نیازمند بهبود روشنایی معابر)</li>
            <li>ستون‌های نارنجی بلند = تصادفات طلوع آفتاب بالا (نیاز به هشدار رانندگان)</li>
            <li>ستون‌های قرمز بلند = تصادفات غروب آفتاب بالا (خطر گذار از روز به شب)</li>
            <li>مقایسه سهم هر وضعیت روشنایی بین مناطق برای اولویت‌بندی بهبود زیرساخت</li>
            <li>مناطقی با نسبت بالا تصادفات شب نیاز به نصب یا تعمیر چراغ‌های خیابانی دارند</li>
            <li>
              مناطقی با نسبت بالا تصادفات طلوع/غروب ممکن است نیاز به علائم هشدار دهنده داشته باشند
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpatialLightBarChart;
