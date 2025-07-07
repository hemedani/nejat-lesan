"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Data interfaces
interface CollisionData {
  name: string;
  share: number;
}

interface EventCollisionData {
  eventData: CollisionData[];
  nonEventData: CollisionData[];
}

interface EventRange {
  from: string;
  to: string;
}

interface ChartProps {
  data: EventCollisionData | null;
  isLoading: boolean;
  eventRange: EventRange;
  selectedEventType: string;
}

// Helper function to get event type label
const getEventTypeLabel = (eventType: string): string => {
  switch (eventType) {
    case "nowruz":
      return "طرح نوروزی";
    case "arbaeen":
      return "طرح اربعین";
    case "custom":
      return "بازه دلخواه";
    default:
      return "رویداد";
  }
};

const EventCollisionComparisonChart: React.FC<ChartProps> = ({
  data,
  isLoading,
  eventRange,
  selectedEventType,
}) => {
  // Early return for loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          مقایسه سهم نحوه و نوع برخورد در رویداد
        </h3>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  // Early return for no data state
  if (!data || (!data.eventData?.length && !data.nonEventData?.length)) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          مقایسه سهم نحوه و نوع برخورد در رویداد
        </h3>
        <div className="flex items-center justify-center h-96">
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
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              داده‌ای موجود نیست
            </h4>
            <p className="text-gray-600">
              اطلاعات تحلیل نحوه برخورد در فیلترهای انتخابی یافت نشد.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Extract data for charts
  const eventData = data.eventData || [];
  const nonEventData = data.nonEventData || [];

  // Chart configuration for event data
  const eventChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%";
      },
      offsetY: -20,
      style: {
        fontSize: "12px",
        colors: ["#304758"],
      },
    },
    xaxis: {
      categories: eventData.map((item) => item.name),
      labels: {
        style: {
          fontSize: "12px",
        },
        rotate: -45,
        rotateAlways: true,
      },
    },
    yaxis: {
      title: {
        text: "درصد",
      },
      labels: {
        formatter: function (val: number) {
          return val.toFixed(0) + "%";
        },
      },
      max: Math.max(...eventData.map((item) => item.share), 100) * 1.1,
    },
    colors: ["#3B82F6"],
    tooltip: {
      y: {
        formatter: function (val: number) {
          return `${val.toFixed(1)}%`;
        },
      },
    },
    title: {
      text: "در رویداد",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: "600",
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  // Chart configuration for non-event data
  const nonEventChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%";
      },
      offsetY: -20,
      style: {
        fontSize: "12px",
        colors: ["#304758"],
      },
    },
    xaxis: {
      categories: nonEventData.map((item) => item.name),
      labels: {
        style: {
          fontSize: "12px",
        },
        rotate: -45,
        rotateAlways: true,
      },
    },
    yaxis: {
      title: {
        text: "درصد",
      },
      labels: {
        formatter: function (val: number) {
          return val.toFixed(0) + "%";
        },
      },
      max: Math.max(...nonEventData.map((item) => item.share), 100) * 1.1,
    },
    colors: ["#DC2626"],
    tooltip: {
      y: {
        formatter: function (val: number) {
          return `${val.toFixed(1)}%`;
        },
      },
    },
    title: {
      text: "سایر ایام سال",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: "600",
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  const eventChartSeries = [
    {
      name: "درصد",
      data: eventData.map((item) => item.share),
    },
  ];

  const nonEventChartSeries = [
    {
      name: "درصد",
      data: nonEventData.map((item) => item.share),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with event info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            مقایسه سهم نحوه و نوع برخورد در رویداد
          </h3>
          <div className="text-sm text-gray-600">
            <span className="font-medium">
              {getEventTypeLabel(selectedEventType)}
            </span>
            <span className="mx-2">|</span>
            <span>
              {eventRange.from} تا {eventRange.to}
            </span>
          </div>
        </div>

        {/* Summary statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">
              انواع برخورد در رویداد
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {eventData.length}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              نوع برخورد شناسایی شده
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium">
              انواع برخورد سایر ایام
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {nonEventData.length}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              نوع برخورد شناسایی شده
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {eventData.length > 0 ? (
            <Chart
              options={eventChartOptions}
              series={eventChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
                <p className="text-gray-600">داده‌ای برای رویداد موجود نیست</p>
              </div>
            </div>
          )}
        </div>

        {/* Non-Event Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {nonEventData.length > 0 ? (
            <Chart
              options={nonEventChartOptions}
              series={nonEventChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
                <p className="text-gray-600">
                  داده‌ای برای سایر ایام موجود نیست
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison insights */}
      {eventData.length > 0 && nonEventData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            تحلیل مقایسه‌ای
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventData.map((eventItem) => {
              const nonEventItem = nonEventData.find(
                (item) => item.name === eventItem.name,
              );

              if (!nonEventItem) return null;

              const difference = eventItem.share - nonEventItem.share;

              return (
                <div
                  key={eventItem.name}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {eventItem.name}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      در رویداد: {eventItem.share.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">
                      سایر ایام: {nonEventItem.share.toFixed(1)}%
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        difference >= 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {difference >= 0 ? "+" : ""}
                      {difference.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCollisionComparisonChart;
