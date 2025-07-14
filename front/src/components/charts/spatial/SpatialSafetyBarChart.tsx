"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SpatialSafetyBarChartProps {
  data: Array<{
    name: string;
    barChartMetric: number;
    mapChartMetric: number;
  }> | null;
  isLoading: boolean;
}

const SpatialSafetyBarChart: React.FC<SpatialSafetyBarChartProps> = ({
  data,
  isLoading,
}) => {
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

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          شاخص متوفیان به جمعیت
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">داده‌ای برای نمایش موجود نیست</p>
        </div>
      </div>
    );
  }

  // Transform data for ApexCharts
  const chartData = {
    categories: data.map(item => item.name),
    series: [{
      name: "نسبت متوفیان به جمعیت",
      data: data.map(item => item.barChartMetric)
    }]
  };

  const chartOptions = {
    chart: {
      type: "bar" as const,
      height: 350,
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
        columnWidth: '60%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(2);
      },
      offsetY: -20,
      style: {
        fontSize: "12px",
        colors: ["#304758"],
        fontWeight: 600,
      },
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          fontSize: "12px",
        },
        rotate: -45,
      },
    },
    yaxis: {
      title: {
        text: "نسبت متوفیان به جمعیت (در ده هزار نفر)",
        style: {
          fontSize: "14px",
          fontWeight: 600,
        },
      },
      labels: {
        formatter: function (val: number) {
          return val.toFixed(2);
        },
      },
    },
    legend: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
    colors: ["#EF4444"],
    grid: {
      show: true,
      borderColor: "#e5e7eb",
      strokeDashArray: 0,
      position: "back" as const,
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toFixed(2) + " در ده هزار نفر";
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          شاخص متوفیان به جمعیت
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          نمودار ستونی
        </div>
      </div>

      <div className="mt-4">
        <Chart
          options={chartOptions}
          series={chartData.series}
          type="bar"
          height={350}
        />
      </div>

      {/* Chart Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>نسبت متوفیان به جمعیت در هر ده هزار نفر</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          این شاخص نسبت تعداد متوفیان تصادفات رانندگی به جمعیت هر منطقه را نشان می‌دهد
        </p>
      </div>
    </div>
  );
};

export default SpatialSafetyBarChart;
