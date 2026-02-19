"use client";

import React, { useState, useEffect, useRef } from "react";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { eventCollisionAnalytics } from "@/app/actions/accident/eventCollisionAnalytics";
import { gets as getEvents } from "@/app/actions/event/gets";
import { get as getEvent } from "@/app/actions/event/get";
import EventCollisionComparisonChart from "../../../../components/dashboards/charts/EventCollisionComparisonChart";
import dynamic from "next/dynamic";
import { SelectOption } from "@/components/atoms/MyAsyncMultiSelect";
import { useAuth } from "@/context/AuthContext";

// Dynamically import AsyncSelect
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

// Function to load event options for AsyncSelect
const loadEventsOptions = async (inputValue?: string): Promise<SelectOption[]> => {
  try {
    const result = await getEvents({
      set: {
        limit: 20,
        page: 1,
        ...(inputValue ? { name: inputValue } : {}),
      },
      get: {
        _id: 1,
        name: 1,
      },
    });

    if (result.success && result.body) {
      return result.body.map((event: { _id: string; name: string }) => ({
        value: event._id,
        label: event.name,
      }));
    }
  } catch (error) {
    console.error("Error loading events:", error);
  }
  return [];
};

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

// Event Selector Component
interface EventSelectorProps {
  onEventIdChange: (eventId: string | null) => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({ onEventIdChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">انتخاب رویداد</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب رویداد</label>
        <AsyncSelect
          cacheOptions
          defaultOptions
          loadOptions={loadEventsOptions}
          onChange={(newValue) => {
            const selectedOption = newValue as SelectOption | null;
            const eventId = selectedOption?.value || null;
            onEventIdChange(eventId);
          }}
          placeholder="رویداد را انتخاب کنید"
          noOptionsMessage={() => "رویدادی یافت نشد"}
          loadingMessage={() => "در حال بارگذاری..."}
          isRtl={true}
          isClearable
          styles={{
            control: (provided, state) => ({
              ...provided,
              minHeight: "48px",
              borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
              borderRadius: "8px",
              boxShadow: "none",
              "&:hover": {
                borderColor: "#94a3b8",
              },
            }),
            valueContainer: (provided) => ({
              ...provided,
              padding: "2px 12px",
            }),
            placeholder: (provided) => ({
              ...provided,
              color: "#64748b",
            }),
            singleValue: (provided) => ({
              ...provided,
              color: "#1e293b",
              overflow: "visible",
              maxWidth: "100%",
              fontWeight: 500,
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
              color: state.isSelected ? "white" : "#1e293b",
              cursor: "pointer",
              padding: "10px 12px",
            }),
            menu: (provided) => ({
              ...provided,
              zIndex: 9999,
            }),
          }}
        />
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventRange, setEventRange] = useState<EventRange>({
    from: "",
    to: "",
  });

  const [chartData, setChartData] = useState<EventCollisionResponse["analytics"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

  // Create refs for functions using initializers that won't reference undefined functions
  const fetchDataRef = useRef<
    ((filters: ChartFilterState, range: EventRange, eventId: string | null) => Promise<void>) | null
  >(null);
  const loadInitialDataRef = useRef<(() => Promise<void>) | null>(null);

  // Update refs when functions change
  useEffect(() => {
    fetchDataRef.current = fetchData;
  });

  useEffect(() => {
    loadInitialDataRef.current = loadInitialData;
  });

  // Load initial data on component mount
  useEffect(() => {
    const initializePage = async () => {
      try {
        loadInitialDataRef.current?.();
      } catch (err) {
        console.log(err);
        setError(`خطا در بارگذاری داده‌های اولیه`);
      }
    };

    initializePage();
  }, []);

  const loadInitialData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
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
          // Include the event ID if one is selected
          ...(selectedEventId && { eventId: selectedEventId }),
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
  }, [eventRange, selectedEventId, setIsLoading, setError, setChartData]);

  // Handle filter submission
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setAppliedFilters(filters);
    await fetchDataRef.current?.(filters, eventRange, selectedEventId);
  };

  // Handle event ID changes
  const handleEventIdChange = React.useCallback(
    async (eventId: string | null) => {
      setSelectedEventId(eventId);
      if (eventId) {
        try {
          // Get the full event details to extract date ranges for UI display
          const eventResponse = await getEvent(eventId, {
            _id: 1,
            name: 1,
            description: 1,
            dates: 1,
          });

          console.log({ eventResponse });

          if (eventResponse && eventResponse.success && eventResponse.body) {
            const event = eventResponse.body;
            if (event.dates && event.dates.length > 0) {
              // Calculate the overall date range encompassing all date ranges in the event
              let earliestDate = new Date(event.dates[0].startEntireRange);
              let latestDate = new Date(event.dates[0].endEntireRange);

              for (const dateRange of event.dates) {
                const startEntireRangeDate = new Date(dateRange.startEntireRange);
                const endEntireRangeDate = new Date(dateRange.endEntireRange);

                if (startEntireRangeDate < earliestDate) earliestDate = startEntireRangeDate;
                if (endEntireRangeDate > latestDate) latestDate = endEntireRangeDate;
              }

              const overallStart = earliestDate.toISOString();
              const overallEnd = latestDate.toISOString();

              const newRange = { from: overallStart, to: overallEnd };
              setEventRange(newRange);

              // Pass only the eventId to the backend — it handles its own date ranges
              await fetchDataRef.current?.(appliedFilters, { from: "", to: "" }, eventId);
            } else {
              // If no dates found in the event, still fetch with the event ID
              await fetchData(appliedFilters, { from: "", to: "" }, eventId);
            }
          } else {
            console.error(
              "Failed to fetch event details:",
              eventResponse?.error || "No response body",
            );
            await fetchDataRef.current?.(appliedFilters, { from: "", to: "" }, eventId);
          }
        } catch (error) {
          console.error("Error fetching event details:", error);
          await fetchDataRef.current?.(appliedFilters, { from: "", to: "" }, eventId);
        }
      } else {
        // No event selected — re-fetch with sidebar filters only
        await fetchDataRef.current?.(appliedFilters, eventRange, null);
      }
    },
    [appliedFilters, eventRange, fetchDataRef, setEventRange, setSelectedEventId],
  );

  // Fetch data with current filters and event range
  const fetchData = async (filters: ChartFilterState, range: EventRange, eventId: string | null) => {
    // We need at least an event ID, a date range, or sidebar date filters
    if (!range.from && !range.to && !eventId && !filters.dateOfAccidentFrom) return;

    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const result = await eventCollisionAnalytics({
        set: {
          // If an event ID is provided, the backend extracts its own date ranges;
          // otherwise fall back to sidebar filters or the computed range
          ...(eventId
            ? {}
            : {
                dateOfAccidentFrom: filters.dateOfAccidentFrom || range.from || "",
                dateOfAccidentTo: filters.dateOfAccidentTo || range.to || "",
              }),
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
          // Include the event ID if one is selected
          ...(eventId && { eventId }),
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
    } catch (err) {
      console.error("Error fetching data:", err);
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
          <EventSelector onEventIdChange={handleEventIdChange} />

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
            selectedEventType="event"
          />
        </div>
      </div>
    </div>
  );
};

export default EventCollisionAnalyticsPage;
