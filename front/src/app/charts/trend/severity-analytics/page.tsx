"use client";

import React, { useState, useEffect, useRef } from "react";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { eventSeverityAnalytics } from "@/app/actions/accident/eventSeverityAnalytics";
import { gets as getEvents } from "@/app/actions/event/gets";
import { get as getEvent } from "@/app/actions/event/get";
import EventSeverityComparisonChart from "@/components/dashboards/charts/EventSeverityComparisonChart";
import { DatePicker } from "zaman";
import dynamic from "next/dynamic";
import { SelectOption } from "@/components/atoms/MyAsyncMultiSelect";
import { useAuth } from "@/context/AuthContext";

// Dynamically import AsyncSelect
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

// Define the event type based on the schema
interface EventType {
  _id: string;
  name: string;
  description: string;
  dates: Array<{
    from: string;
    to: string;
    startEntireRange: string;
    endEntireRange: string;
  }>; // Array of date ranges in the new format
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: "Male" | "Female";
    national_number: string;
    address: string;
    level: "Ghost" | "Manager" | "Editor" | "Ordinary";
    is_verified: boolean;
  };
}

// Function to fetch all events from the backend
const fetchEvents = async (): Promise<EventType[]> => {
  try {
    const result = await getEvents({
      set: {
        limit: 100, // Get up to 100 events
        page: 1,
      },
      get: {
        _id: 1,
        name: 1,
        description: 1,
        dates: 1,
        registrer: {
          first_name: 1,
          last_name: 1,
        },
      },
    });

    if (result.success && result.body) {
      return result.body.events || [];
    } else {
      console.error("Failed to fetch events:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

// Function to load event options for AsyncSelect
const loadEventsOptions = async (inputValue?: string): Promise<SelectOption[]> => {
  try {
    const result = await getEvents({
      set: {
        limit: 20,
        page: 1,
        ...(inputValue ? { name: inputValue } : {}), // Search by name if inputValue is provided
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

// Get enabled filters for trend severity analytics
// Note: This will be moved inside the component to access auth context

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
  { id: "event", label: "انتخاب رخداد خاص", value: null },
  { id: "custom", label: "بازه دلخواه", value: null },
];

// Event Selector Component
interface EventSelectorProps {
  selectedEventType: string;
  selectedEventId: string | null;
  eventRange: EventRange;
  availableEvents: EventType[];
  loadEventsOptions: (inputValue?: string) => Promise<SelectOption[]>;
  onEventTypeChange: (eventType: string) => void;
  onEventIdChange: (eventId: string | null) => void;
  onEventRangeChange: (range: EventRange) => void;
  onEventTypeChangeWithClear: (eventType: string) => void; // New function that includes clearing event date ranges
}

const EventSelector: React.FC<EventSelectorProps> = ({
  selectedEventType,
  eventRange,
  onEventTypeChangeWithClear,
  onEventIdChange,
  onEventRangeChange,
}) => {
  // Handle event type change (specific event, or custom range)
  const handleEventTypeChange = (eventType: string) => {
    // Call the parent function which handles clearing event date ranges
    onEventTypeChangeWithClear(eventType);

    // Reset event ID when type changes
    if (eventType !== "event") {
      onEventIdChange(null);
    }

    // Set default range based on type
    if (eventType === "custom") {
      onEventRangeChange({ from: "", to: "" });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">انتخاب رویداد</h3>

      {/* Event Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">نوع رویداد</label>
        <div className="flex space-x-4 space-x-reverse">
          {EVENT_TYPES.map((eventType) => (
            <button
              key={eventType.id}
              onClick={() => handleEventTypeChange(eventType.id)}
              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
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

      {/* Event Selection (only shown when 'event' type is selected) */}
      {selectedEventType === "event" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب رویداد</label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadEventsOptions}
            onChange={(newValue) => {
              const selectedOption = newValue as SelectOption | null;
              const eventId = selectedOption?.value || null;
              // Just call the parent function which handles getting full event details and updating date range
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
                overflow: "visible", // Prevent text truncation
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
      )}

      {/* Date Range Selection (only for custom type) */}
      {selectedEventType === "custom" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ شروع</label>
            <DatePicker
              defaultValue={eventRange.from ? new Date(eventRange.from) : undefined}
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
                border-slate-300
              `}
              inputAttributes={{
                placeholder: "تاریخ شروع",
              }}
              round="x2"
              accentColor="#3b82f6"
              locale="fa"
              direction="rtl"
              show={false}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ پایان</label>
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
                border-slate-300
              `}
              inputAttributes={{
                placeholder: "تاریخ پایان",
              }}
              round="x2"
              accentColor="#3b82f6"
              locale="fa"
              direction="rtl"
              show={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const EventSeverityAnalyticsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();

  // Get enabled filters for trend severity analytics considering enterprise settings
  const ENABLED_FILTERS = getEnabledFiltersForChartWithPermissions(
    "TREND_SEVERITY_ANALYTICS",
    userLevel === "Enterprise" ? enterpriseSettings : undefined,
  );

  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState("event");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventRange, setEventRange] = useState<EventRange>({
    from: "", // Default to empty which means no start limitation
    to: "", // Default to empty which means no end limitation
  });
  const [eventDateRanges, setEventDateRanges] = useState<{ from: string; to: string }[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventType[]>([]);
  const [chartData, setChartData] = useState<EventSeverityResponse["analytics"] | null>(null);
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
    // Fetch available events and then load initial data
    const initializePage = async () => {
      try {
        // Fetch events from backend
        const events = await fetchEvents();
        setAvailableEvents(events);

        // Load initial analytics data
        loadInitialDataRef.current?.();
      } catch (err) {
        console.log(err);
        setError(`خطا در بارگذاری رویدادها`);
      }
    };

    initializePage();
  }, []);

  const loadInitialData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the current event range for initial data loading
      const result = await eventSeverityAnalytics({
        set: {
          // Only include date ranges if no event is selected
          ...(selectedEventType === "custom" && {
            dateOfAccidentFrom: eventRange.from,
            dateOfAccidentTo: eventRange.to,
          }),
          officer: "",
          province: [],
          city: [],
          road: [],
          trafficZone: [],
          cityZone: [],
          accidentType: [],
          position: [],
          rulingType: [],
          lightStatus: [],
          collisionType: [],
          roadSituation: [],
          roadRepairType: [],
          shoulderStatus: [],
          areaUsages: [],
          airStatuses: [],
          roadDefects: [],
          humanReasons: [],
          vehicleReasons: [],
          roadSurfaceConditions: [],
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
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل شدت رویداد");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  }, [eventRange, selectedEventType, selectedEventId, setIsLoading, setError, setChartData]);

  // Handle filter submission
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setAppliedFilters(filters);
    await fetchDataRef.current?.(filters, eventRange, selectedEventId);
  };

  // Handle event type changes with clearing event date ranges
  const handleEventTypeChangeWithClear = (eventType: string) => {
    // Clear event date ranges when switching from event to another type
    if (selectedEventType === "event" && eventType !== "event") {
      setEventDateRanges([]);
    }
    setSelectedEventType(eventType);
  };

  // Handle event range changes
  const handleEventRangeChange = async (range: EventRange) => {
    setEventRange(range);
    // Clear the event date ranges when custom date range is changed
    // since we're now using a custom range instead of event ranges
    setEventDateRanges([]);
    if (range.from && range.to) {
      await fetchDataRef.current?.(appliedFilters, range, selectedEventId);
    }
  };

  // Handle event ID changes
  const handleEventIdChange = React.useCallback(
    async (eventId: string | null) => {
      setSelectedEventId(eventId);
      // If an event is selected, we need to get its dates for UI display and pass event ID to backend
      if (eventId) {
        try {
          // Get the full event details (not just the id/name from the AsyncSelect)
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
              // dates is now an array of objects with from, to, startEntireRange, endEntireRange
              let earliestDate = new Date(event.dates[0].startEntireRange); // First overall start date
              let latestDate = new Date(event.dates[0].endEntireRange); // First overall end date

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

              // Store all the date ranges to display them in the chart header
              const allDateRanges = (event as EventType).dates.map((dateRange) => ({
                from: dateRange.from,
                to: dateRange.to,
                startEntireRange: dateRange.startEntireRange,
                endEntireRange: dateRange.endEntireRange,
              }));
              setEventDateRanges(allDateRanges);

              // When an event is selected, we pass the eventId to the backend and no date ranges
              await fetchDataRef.current?.(appliedFilters, { from: "", to: "" }, eventId);
            } else {
              // If no dates found in the event, still fetch data with only the event ID
              await fetchData(appliedFilters, { from: "", to: "" }, eventId);
            }
          } else {
            console.error(
              "Failed to fetch event details:",
              eventResponse?.error || "No response body",
            );
            // Still attempt to fetch data with the event ID even if we couldn't get dates
            await fetchDataRef.current?.(appliedFilters, { from: "", to: "" }, eventId);
          }
        } catch (error) {
          console.error("Error fetching event details:", error);
          // Even if there's an error, try to fetch data with the event ID
          await fetchDataRef.current?.(appliedFilters, { from: "", to: "" }, eventId);
        }
      } else {
        // If no event is selected, maintain the current range and no event ID
        setEventDateRanges([]); // Clear the event date ranges when no event is selected
        await fetchDataRef.current?.(appliedFilters, eventRange, null);
      }
    },
    [appliedFilters, eventRange, fetchDataRef, setEventDateRanges, setEventRange, setSelectedEventId],
  );

  // Fetch data with current filters and event range
  const fetchData = async (filters: ChartFilterState, range: EventRange, eventId: string | null) => {
    // We need at least a date range or an event ID
    if (!range.from && !range.to && !eventId) return;

    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const result = await eventSeverityAnalytics({
        set: {
          // Only include date ranges if no event is selected or custom range is used
          // If an event ID is provided, don't include date ranges as backend will extract them from the event
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
          trafficZone: filters.trafficZone || [],
          cityZone: filters.cityZone || [],
          accidentType: filters.accidentType || [],
          position: filters.position || [],
          rulingType: filters.rulingType || [],
          lightStatus: filters.lightStatus || [],
          collisionType: filters.collisionType || [],
          roadSituation: filters.roadSituation || [],
          roadRepairType: filters.roadRepairType || [],
          shoulderStatus: filters.shoulderStatus || [],
          areaUsages: filters.areaUsages || [],
          airStatuses: filters.airStatuses || [],
          roadDefects: filters.roadDefects || [],
          humanReasons: filters.humanReasons || [],
          vehicleReasons: filters.vehicleReasons || [],
          roadSurfaceConditions: filters.roadSurfaceConditions || [],
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
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل شدت رویداد");
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
      <ChartNavigation currentSection="trend" currentChart="severity-analytics" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل روند شدت"
              description="فیلترهای مربوط به تحلیل روند شدت تصادفات در رویدادها"
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
                <h1 className="text-2xl font-bold text-gray-900">سهم شدت تصادفات در رویداد</h1>
                <p className="text-sm text-gray-600 mt-1">
                  مقایسه سهم شدت تصادفات در دوره رویداد با سایر ایام سال
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
            selectedEventId={selectedEventId}
            eventRange={eventRange}
            availableEvents={availableEvents}
            loadEventsOptions={loadEventsOptions}
            onEventTypeChange={setSelectedEventType}
            onEventTypeChangeWithClear={handleEventTypeChangeWithClear}
            onEventIdChange={handleEventIdChange}
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
            eventDateRanges={eventDateRanges}
          />
        </div>
      </div>
    </div>
  );
};

export default EventSeverityAnalyticsPage;
