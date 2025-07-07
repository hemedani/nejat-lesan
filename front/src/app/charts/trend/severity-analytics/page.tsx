"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { eventSeverityAnalytics } from "@/app/actions/accident/eventSeverityAnalytics";
import EventSeverityComparisonChart from "@/components/dashboards/charts/EventSeverityComparisonChart";
import { DatePicker } from "zaman";

// Backend response interface for event severity analytics
interface EventSeverityResponse {
  analytics: {
    eventData: Array<{
      name: string;
      count: number;
    }>;
    nonEventData: Array<{
      name: string;
      count: number;
    }>;
  };
}

// Event range interface
interface EventRange {
  from: string;
  to: string;
}

// Event type options
const EVENT_TYPES = [
  {
    id: "nowruz",
    label: "طرح نوروزی",
    calculateRange: () => calculateNowruzRange(),
  },
  {
    id: "arbaeen",
    label: "طرح اربعین",
    calculateRange: () => calculateArbaenRange(),
  },
  {
    id: "custom",
    label: "بازه دلخواه",
    calculateRange: () => ({ from: "", to: "" }),
  },
];

// Calculate current year's Nowruz range (March 20 - April 2)
const calculateNowruzRange = (): EventRange => {
  const currentYear = new Date().getFullYear();
  return {
    from: `${currentYear}-03-20`,
    to: `${currentYear}-04-02`,
  };
};

// Calculate current year's Arbaeen range (approximate)
const calculateArbaenRange = (): EventRange => {
  const currentYear = new Date().getFullYear();
  // Arbaeen is usually in September/October, using approximate dates
  return {
    from: `${currentYear}-09-15`,
    to: `${currentYear}-09-25`,
  };
};

// Event Selector Component
interface EventSelectorProps {
  selectedEventType: string;
  eventRange: EventRange;
  onEventTypeChange: (eventType: string) => void;
  onEventRangeChange: (range: EventRange) => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({
  selectedEventType,
  eventRange,
  onEventTypeChange,
  onEventRangeChange,
}) => {
  const handleEventTypeChange = (eventType: string) => {
    onEventTypeChange(eventType);
    if (eventType !== "custom") {
      const eventConfig = EVENT_TYPES.find((e) => e.id === eventType);
      if (eventConfig) {
        onEventRangeChange(eventConfig.calculateRange());
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        انتخاب رویداد
      </h3>

      {/* Event Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          نوع رویداد
        </label>
        <div className="grid grid-cols-3 gap-3">
          {EVENT_TYPES.map((eventType) => (
            <button
              key={eventType.id}
              onClick={() => handleEventTypeChange(eventType.id)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                selectedEventType === eventType.id
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="text-sm font-medium">{eventType.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تاریخ شروع
          </label>
          <DatePicker
            defaultValue={
              eventRange.from ? new Date(eventRange.from) : undefined
            }
            onChange={(e) => {
              if (e && e.value) {
                onEventRangeChange({
                  ...(eventRange || { from: "", to: "" }),
                  from: new Date(e.value).toISOString().split("T")[0],
                });
              } else {
                onEventRangeChange({
                  ...(eventRange || { from: "", to: "" }),
                  from: "",
                });
              }
            }}
            customShowDateFormat="YYYY/MM/DD"
            className="z-999"
            inputClass={`
              w-full px-4 py-3 text-slate-800 bg-white border rounded-xl
              placeholder:text-slate-400 text-right
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500
              hover:border-slate-400 z-999
              ${
                selectedEventType !== "custom"
                  ? "bg-slate-100 cursor-not-allowed opacity-60"
                  : "hover:bg-slate-50/50"
              }
              border-slate-300
            `}
            inputAttributes={{
              placeholder: "تاریخ شروع",
              disabled: selectedEventType !== "custom",
              readOnly: selectedEventType !== "custom",
            }}
            round="x2"
            accentColor="#3b82f6"
            locale="fa"
            direction="rtl"
            show={false}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تاریخ پایان
          </label>
          <DatePicker
            defaultValue={eventRange.to ? new Date(eventRange.to) : undefined}
            onChange={(e) => {
              if (e && e.value) {
                onEventRangeChange({
                  ...(eventRange || { from: "", to: "" }),
                  to: new Date(e.value).toISOString().split("T")[0],
                });
              } else {
                onEventRangeChange({
                  ...(eventRange || { from: "", to: "" }),
                  to: "",
                });
              }
            }}
            customShowDateFormat="YYYY/MM/DD"
            className="z-999"
            inputClass={`
              w-full px-4 py-3 text-slate-800 bg-white border rounded-xl
              placeholder:text-slate-400 text-right
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500
              hover:border-slate-400 z-999
              ${
                selectedEventType !== "custom"
                  ? "bg-slate-100 cursor-not-allowed opacity-60"
                  : "hover:bg-slate-50/50"
              }
              border-slate-300
            `}
            inputAttributes={{
              placeholder: "تاریخ پایان",
              disabled: selectedEventType !== "custom",
              readOnly: selectedEventType !== "custom",
            }}
            round="x2"
            accentColor="#3b82f6"
            locale="fa"
            direction="rtl"
            show={false}
          />
        </div>
      </div>
    </div>
  );
};

const EventSeverityAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState("nowruz");
  const [eventRange, setEventRange] = useState<EventRange>(
    calculateNowruzRange(),
  );
  const [chartData, setChartData] = useState<
    EventSeverityResponse["analytics"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<RoadDefectsFilterState>(
    {},
  );

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const defaultRange = calculateNowruzRange();
      const result = await eventSeverityAnalytics({
        set: {
          dateOfAccidentFrom: "",
          dateOfAccidentTo: "",
          officer: "",
          province: [],
          city: [],
          road: [],
          lightStatus: [],
          collisionType: [],
          roadSituation: [],
          roadSurfaceConditions: [],
          humanReasons: [],
          roadDefects: [],
          vehicleSystem: [],
          driverSex: [],
          driverLicenceType: [],
          eventDateFrom: defaultRange.from,
          eventDateTo: defaultRange.to,
        },
        get: {
          analytics: 1,
        },
      });

      if (result.success && result.body) {
        setChartData(result.body.analytics);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل شدت رویداد");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter submission
  const handleApplyFilters = async (filters: RoadDefectsFilterState) => {
    setAppliedFilters(filters);
    await fetchData(filters, eventRange);
  };

  // Handle event range changes
  const handleEventRangeChange = async (range: EventRange) => {
    setEventRange(range);
    if (range.from && range.to) {
      await fetchData(appliedFilters, range);
    }
  };

  // Fetch data with current filters and event range
  const fetchData = async (
    filters: RoadDefectsFilterState,
    range: EventRange,
  ) => {
    if (!range.from || !range.to) return;

    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const result = await eventSeverityAnalytics({
        set: {
          dateOfAccidentFrom: filters.dateOfAccidentFrom || "",
          dateOfAccidentTo: filters.dateOfAccidentTo || "",
          officer: filters.officer || "",
          province: filters.province || [],
          city: filters.city || [],
          road: filters.road || [],
          lightStatus: filters.lightStatus || [],
          collisionType: filters.collisionType || [],
          roadSituation: filters.roadSituation || [],
          roadSurfaceConditions: filters.roadSurfaceConditions || [],
          humanReasons: filters.humanReasons || [],
          roadDefects: filters.roadDefects || [],
          vehicleSystem: filters.vehicleSystem || [],
          driverSex: filters.driverSex || [],
          driverLicenceType: filters.driverLicenceType || [],
          eventDateFrom: range.from,
          eventDateTo: range.to,
        },
        get: {
          analytics: 1,
        },
      });

      if (result.success && result.body) {
        setChartData(result.body.analytics);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل شدت رویداد");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter configuration
  const getFilterConfig = () => {
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: false,
      lockToSevereAccidents: false,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation
        currentSection="trend"
        currentChart="severity-analytics"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  سهم شدت تصادفات در رویداد
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  مقایسه سهم شدت تصادفات در دوره رویداد با سایر ایام سال
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                  {showFilterSidebar ? "مخفی کردن فیلتر" : "نمایش فیلتر"}
                </button>
              </div>
            </div>
          </div>

          {/* Event Selector */}
          <EventSelector
            selectedEventType={selectedEventType}
            eventRange={eventRange}
            onEventTypeChange={setSelectedEventType}
            onEventRangeChange={handleEventRangeChange}
          />

          {/* Applied Filters Display */}
          <AppliedFiltersDisplay filters={appliedFilters} />

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Chart Display */}
          <EventSeverityComparisonChart
            data={chartData}
            isLoading={isLoading}
            eventRange={eventRange}
            selectedEventType={selectedEventType}
          />
        </div>
      </div>
    </div>
  );
};

export default EventSeverityAnalyticsPage;
