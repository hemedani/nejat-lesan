"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Components
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import AccidentDetailsModal from "@/components/modals/AccidentDetailsModal";

// Hooks
import { useScrollLock } from "@/hooks/useScrollLock";

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

  // Modal state for polygon search results
  const [modalData, setModalData] = useState<accidentSchema[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPolygonLoading, setIsPolygonLoading] = useState<boolean>(false);

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

  // Prevent background scrolling when polygon loading overlay is open
  useScrollLock(isPolygonLoading);

  // Handle shape drawing
  const handleShapeDrawn = async (
    geoJSON: GeoJSON.Feature,
    layer?: { getRadius?(): number },
  ) => {
    setIsPolygonLoading(true);
    try {
      // Extract coordinates from the GeoJSON based on geometry type
      let coordinates: number[][][];

      if (geoJSON.geometry.type === "Polygon") {
        const polygonGeometry = geoJSON.geometry as GeoJSON.Polygon;
        coordinates = polygonGeometry.coordinates;
      } else if (geoJSON.geometry.type === "Point") {
        // Handle circle - get radius from the layer
        const pointGeometry = geoJSON.geometry as GeoJSON.Point;
        const [lng, lat] = pointGeometry.coordinates;
        // Get radius from the layer (in meters) and convert to degrees
        const radiusInMeters = layer?.getRadius ? layer.getRadius() : 1000;
        const radiusInDegrees = radiusInMeters / 111320; // Approximate meters to degrees conversion

        // Development debugging
        if (process.env.NODE_ENV !== "production") {
          console.log("Circle center coordinates:", lng, lat);
          console.log("Circle radius in meters:", radiusInMeters);
          console.log("Layer has getRadius method:", !!layer?.getRadius);
          console.log("Circle radius in degrees:", radiusInDegrees);
        }

        // Create a more accurate polygon approximation of the circle
        const segments = 32; // Number of segments for circle approximation
        const circleCoordinates: number[][] = [];

        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * 2 * Math.PI;
          const x = lng + radiusInDegrees * Math.cos(angle);
          const y = lat + radiusInDegrees * Math.sin(angle);
          circleCoordinates.push([x, y]);
        }

        coordinates = [circleCoordinates];

        // Development debugging
        if (process.env.NODE_ENV !== "production") {
          console.log("Generated circle polygon coordinates:", coordinates);
        }
      } else {
        // Default fallback for other geometry types - convert to polygon format
        const geom = geoJSON.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        coordinates = geom.coordinates as number[][][];
      }

      // Create polygon filter with current applied filters
      const requestPayload = {
        ...appliedFilters,
        polygon: {
          type: "Polygon" as const,
          coordinates: coordinates,
        },
        limit: 5000, // Higher limit for polygon searches
        skip: 0,
      };

      const response = await mapAccidents({
        set: requestPayload,
        get: { accidents: 1 as const, total: 1 as const },
      });

      if (response.success && response.body) {
        setModalData(response.body.accidents || []);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching polygon accidents:", error);
    } finally {
      setIsPolygonLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalData(null);
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
              <AccidentMap
                accidents={accidents}
                isLoading={isLoading}
                onShapeDrawn={handleShapeDrawn}
              />
            </div>
          </div>

          {/* Loading overlay for polygon search */}
          {isPolygonLoading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1500]">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700">
                    در حال جستجو در منطقه انتخاب شده...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Accident Details Modal */}
          <AccidentDetailsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            data={modalData || []}
          />

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
