"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { eventCollisionAnalytics } from "@/app/actions/accident/eventCollisionAnalytics";
import EventCollisionComparisonChart from "../../../../components/dashboards/charts/EventCollisionComparisonChart";
import { useAuth } from "@/context/AuthContext";
import MyStandaloneDatePicker from "@/components/atoms/MyStandaloneDatePicker";

// Backend response interface for event collision analytics
interface EventCollisionResponse {
  analytics: {
    eventData: Array<{
      name: string;
      share: number;
    }>;
    nonEventData: Array<{
      name: string;
      share: number;
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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">انتخاب رویداد</h3>

      {/* Event Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">نوع رویداد</label>
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
          <MyStandaloneDatePicker
            label="تاریخ شروع"
            value={eventRange.from ? new Date(eventRange.from) : null}
            onChange={(date) => {
              if (date) {
                onEventRangeChange({
                  ...(eventRange || { from: "", to: "" }),
                  from: date.toISOString().split("T")[0],
                });
              } else {
                onEventRangeChange({
                  ...(eventRange || { from: "", to: "" }),
                  from: "",
                });
              }
            }}
            placeholder="تاریخ شروع"
            disabled={selectedEventType !== "custom"}
          />
        </div>
        <div>
          <MyStandaloneDatePicker
            label="تاریخ پایان"
            value={eventRange.to ? new Date(eventRange.to) : null}
            onChange={(date) => {
              if (date) {
                onEventRangeChange({
                  ...(eventRange || { from: "", to: "" }),
                  to: date.toISOString().split("T")[0],
                });
              } else {
                onEventRangeChange({
                  ...(eventRange || { from: "", to: "" }),
                  to: "",
                });
              }
            }}
            placeholder="تاریخ پایان"
            disabled={selectedEventType !== "custom"}
          />
        </div>
      </div>
    </div>
  );
};

const EventCollisionAnalyticsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();

  // Get enabled filters for trend collision analytics considering enterprise settings
  const ENABLED_FILTERS = getEnabledFiltersForChartWithPermissions(
    "TREND_COLLISION_ANALYTICS",
    userLevel === "Enterprise" ? enterpriseSettings : undefined,
  );

  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState("nowruz");
  const [eventRange, setEventRange] = useState<EventRange>(calculateNowruzRange());
  const [chartData, setChartData] = useState<EventCollisionResponse["analytics"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const defaultRange = calculateNowruzRange();
      const result = await eventCollisionAnalytics({
        set: {
          dateOfAccidentFrom: "",
          dateOfAccidentTo: "",
          officer: "",
          province: [],
          city: [],
          road: [],
          accidentType: [],
          lightStatus: [],
          collisionType: [],
          roadSituation: [],
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
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل نحوه برخورد");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter submission
  const handleApplyFilters = async (filters: ChartFilterState) => {
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
  const fetchData = async (filters: ChartFilterState, range: EventRange) => {
    if (!range.from || !range.to) return;

    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const result = await eventCollisionAnalytics({
        set: {
          dateOfAccidentFrom: filters.dateOfAccidentFrom || "",
          dateOfAccidentTo: filters.dateOfAccidentTo || "",
          officer: filters.officer || "",
          province: filters.province || [],
          city: filters.city || [],
          road: filters.road || [],
          accidentType: filters.accidentType || [],
          lightStatus: filters.lightStatus || [],
          collisionType: filters.collisionType || [],
          roadSituation: filters.roadSituation || [],
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
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل نحوه برخورد");
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
      <ChartNavigation currentSection="trend" currentChart="collision-analytics" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل روند برخورد"
              description="فیلترهای مربوط به تحلیل روند نوع برخورد در رویدادها"
              enterpriseSettings={enterpriseSettings}
              activeAdvancedFilters={true}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">روند رویداد نحوه و نوع برخورد</h1>
                <p className="text-sm text-gray-600 mt-1">
                  مقایسه سهم نحوه و نوع برخورد در دوره رویداد با سایر ایام سال
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <EventCollisionComparisonChart
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

export default EventCollisionAnalyticsPage;
