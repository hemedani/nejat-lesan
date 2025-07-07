"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Components
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";

// Actions
import { mapAccidents } from "@/app/actions/accident/mapAccidents";

// Types
import { accidentSchema } from "@/types/declarations/selectInp";

// Dynamic import for map components (disable SSR)
const AccidentMap = dynamic(() => import("@/components/maps/AccidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">در حال بارگیری نقشه...</p>
      </div>
    </div>
  ),
});

// Main Page Component
const AccidentsMapPage: React.FC = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [accidents, setAccidents] = useState<accidentSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState<RoadDefectsFilterState>(
    {},
  );

  // Handle filter submission
  const handleApplyFilters = async (filters: RoadDefectsFilterState) => {
    setIsLoading(true);
    try {
      // If no date filter provided, default to last year
      const finalFilters = { ...filters };
      if (!finalFilters.dateOfAccidentFrom && !finalFilters.dateOfAccidentTo) {
        const lastYear = new Date().getFullYear() - 1;
        finalFilters.dateOfAccidentFrom = `${lastYear}-01-01`;
        finalFilters.dateOfAccidentTo = `${lastYear}-12-31`;
      }

      // Set reasonable limit for initial load
      const requestPayload = {
        ...finalFilters,
        limit: 1000,
        skip: 0,
      };

      const response = await mapAccidents({
        set: requestPayload,
        get: { accidents: 1 as const, total: 1 as const },
      });

      if (response.success && response.body) {
        setAccidents(response.body.accidents || []);
        setTotal(response.body.total || 0);
        setAppliedFilters(finalFilters);
      }
    } catch (error) {
      console.error("Error fetching accidents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleApplyFilters({});
  }, []);

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
      <ChartNavigation />

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
                  نقشه تصادفات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  نمایش جغرافیایی تصادفات با قابلیت فیلتر و تحلیل مکانی
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

          {/* Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Map Container */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-[700px]">
              <AccidentMap accidents={accidents} isLoading={isLoading} />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">کل تصادفات</h3>
              <p className="text-2xl font-bold text-blue-600">
                {total.toLocaleString("fa-IR")}
              </p>
              <p className="text-sm text-gray-600">در پایگاه داده</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                نمایش داده شده
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {accidents.length.toLocaleString("fa-IR")}
              </p>
              <p className="text-sm text-gray-600">روی نقشه</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">درصد نمایش</h3>
              <p className="text-2xl font-bold text-purple-600">
                {total > 0
                  ? ((accidents.length / total) * 100).toFixed(1)
                  : "0"}
                %
              </p>
              <p className="text-sm text-gray-600">از کل داده‌ها</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccidentsMapPage;
