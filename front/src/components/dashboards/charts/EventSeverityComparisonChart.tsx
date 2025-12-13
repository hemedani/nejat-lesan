"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { format } from "date-fns-jalali";

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Data interfaces
interface SeverityData {
  name: string;
  count: number;
}

interface EventSeverityData {
  eventData: SeverityData[];
  nonEventData: SeverityData[];
}

interface EventRange {
  from: string;
  to: string;
}

interface EventDateRange {
  from: string;
  to: string;
  startEntireRange?: string;
  endEntireRange?: string;
}

interface ChartProps {
  data: EventSeverityData | null;
  isLoading: boolean;
  eventRange: EventRange;
  selectedEventType: string;
  eventDateRanges?: EventDateRange[]; // Additional prop to pass all date ranges of an event
}

// Helper function to calculate percentages
const calculatePercentages = (data: SeverityData[]) => {
  if (!data || data.length === 0)
    return { percentages: [], labels: [], counts: [] };

  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  if (totalCount === 0) return { percentages: [], labels: [], counts: [] };

  const percentages = data.map((item) => (item.count / totalCount) * 100);
  const labels = data.map((item) => item.name);
  const counts = data.map((item) => item.count);

  return { percentages, labels, counts };
};

// Helper function to convert Gregorian date to Jalali and format it
const formatJalaliDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    // Convert to Jalali date and format as YYYY/MM/DD
    return format(new Date(dateString), "yyyy/MM/dd");
  } catch (error) {
    console.error("Error converting date to Jalali:", error);
    return dateString; // Return original if conversion fails
  }
};

// Helper function to get event type label
const getEventTypeLabel = (eventType: string): string => {
  switch (eventType) {
    case "nowruz":
      return "طرح نوروزی";
    case "arbaeen":
      return "طرح اربعین";
    case "custom":
      return "بازه دلخواه";
    case "event":
      return "رویداد انتخاب شده";
    default:
      return "رویداد";
  }
};

const EventSeverityComparisonChart: React.FC<ChartProps> = ({
  data,
  isLoading,
  eventRange,
  selectedEventType,
  eventDateRanges,
}) => {
  // Early return for loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          مقایسه سهم شدت تصادفات در رویداد
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
          مقایسه سهم شدت تصادفات در رویداد
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
              اطلاعات تحلیل شدت رویداد در فیلترهای انتخابی یافت نشد.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentages for both datasets
  const eventAnalysis = calculatePercentages(data.eventData || []);
  const nonEventAnalysis = calculatePercentages(data.nonEventData || []);

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
      categories: eventAnalysis.labels,
      labels: {
        style: {
          fontSize: "12px",
        },
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
      max: 100,
    },
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
    tooltip: {
      y: {
        formatter: function (val: number, opts: { dataPointIndex: number }) {
          const index = opts.dataPointIndex;
          const count = eventAnalysis.counts[index] || 0;
          return `${val.toFixed(1)}% (${count} تصادف)`;
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
      categories: nonEventAnalysis.labels,
      labels: {
        style: {
          fontSize: "12px",
        },
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
      max: 100,
    },
    colors: ["#DC2626", "#059669", "#D97706"],
    tooltip: {
      y: {
        formatter: function (val: number, opts: { dataPointIndex: number }) {
          const index = opts.dataPointIndex;
          const count = nonEventAnalysis.counts[index] || 0;
          return `${val.toFixed(1)}% (${count} تصادف)`;
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
      data: eventAnalysis.percentages,
    },
  ];

  const nonEventChartSeries = [
    {
      name: "درصد",
      data: nonEventAnalysis.percentages,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with event info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            مقایسه سهم شدت تصادفات در رویداد
          </h3>
          <div className="text-sm text-gray-600 flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-medium bg-blue-50 px-2 py-1 rounded-md">
                {getEventTypeLabel(selectedEventType)}
              </span>
              <span className="hidden sm:inline-block mx-1">|</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedEventType === "event" &&
              eventDateRanges &&
              eventDateRanges.length > 0 ? (
                // Show all date ranges for an event
                eventDateRanges.map((range, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-800 font-medium">
                        {formatJalaliDate(range.from)}
                      </span>
                      <span className="text-gray-400 self-center">تا</span>
                      <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-800 font-medium">
                        {formatJalaliDate(range.to)}
                      </span>
                    </div>
                    {range.startEntireRange && range.endEntireRange && (
                      <div className="text-xs flex items-center text-gray-500">
                        <span className="font-medium">کل بازه:</span>
                        <span className="mx-1">
                          {formatJalaliDate(range.startEntireRange)}
                        </span>
                        <span>تا</span>
                        <span className="mx-1">
                          {formatJalaliDate(range.endEntireRange)}
                        </span>
                      </div>
                    )}
                    {index < eventDateRanges.length - 1 && (
                      <div className="w-full my-1 border-t border-gray-200"></div>
                    )}
                  </div>
                ))
              ) : (
                // Show overall date range for other types
                <div className="flex items-center gap-1">
                  <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-800 font-medium">
                    {formatJalaliDate(eventRange.from)}
                  </span>
                  <span className="text-gray-400 self-center">تا</span>
                  <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-800 font-medium">
                    {formatJalaliDate(eventRange.to)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">
              تصادفات در رویداد
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {(data.eventData || [])
                .reduce((sum, item) => sum + item.count, 0)
                .toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium">
              تصادفات سایر ایام
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(data.nonEventData || [])
                .reduce((sum, item) => sum + item.count, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {eventAnalysis.percentages.length > 0 ? (
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
          {nonEventAnalysis.percentages.length > 0 ? (
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
      {eventAnalysis.percentages.length > 0 &&
        nonEventAnalysis.percentages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              تحلیل مقایسه‌ای
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {eventAnalysis.labels.map((label, index) => {
                const eventPercent = eventAnalysis.percentages[index] || 0;
                const nonEventPercent =
                  nonEventAnalysis.percentages[index] || 0;
                const difference = eventPercent - nonEventPercent;

                return (
                  <div
                    key={label}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {label}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        در رویداد: {eventPercent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        سایر ایام: {nonEventPercent.toFixed(1)}%
                      </div>
                      <div
                        className={`text-xs font-medium ${difference >= 0 ? "text-red-600" : "text-green-600"}`}
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

export default EventSeverityComparisonChart;
