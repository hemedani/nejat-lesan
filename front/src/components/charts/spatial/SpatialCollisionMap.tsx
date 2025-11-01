"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { GeoJsonData } from "@/types/GeoJsonTypes";

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false },
);
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false },
);
const AttributionControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.AttributionControl),
  { ssr: false },
);

interface MapData {
  name: string;
  ratio: number;
}

interface MapDataWithCount {
  name: string;
  count: number;
}

// Type guard to check if the object has 'ratio' or 'count'
const hasRatioProperty = (obj: unknown): obj is MapData => {
  return obj !== null && typeof obj === "object" && "ratio" in obj;
};

interface SpatialCollisionMapProps {
  mapData: Array<MapData | MapDataWithCount>;
  geoJsonData: GeoJsonData | null;
  barChartData: {
    categories: string[];
    series: Array<{
      name: string;
      data: number[];
    }>;
  } | null;
  isLoading: boolean;
}

const SpatialCollisionMap: React.FC<SpatialCollisionMapProps> = ({
  mapData,
  geoJsonData,
  barChartData,
  isLoading,
}) => {
  // Convert count-based mapData to ratio-based if needed
  const normalizedMapData = useMemo(() => {
    // Check if the incoming mapData has 'ratio' field (new format) or 'count' field (old format)
    if (mapData.length > 0 && hasRatioProperty(mapData[0])) {
      // Already has ratios, return as-is
      return mapData as MapData[];
    } else {
      // Calculate ratios from counts
      // We need to determine what the ratio represents - likely a percentage of some collision type
      // For now, we'll convert based on the available bar chart data
      const countData = mapData as MapDataWithCount[];

      if (barChartData && barChartData.categories && barChartData.series) {
        return countData.map((item: MapDataWithCount) => {
          // Find the index of this zone in the categories
          const zoneIndex = barChartData.categories.findIndex(
            (cat) => cat === item.name,
          );

          if (zoneIndex !== -1) {
            let total = 0;
            let specificCollisionAccidents = 0; // This would be for a specific collision type

            // Calculate total accidents for this zone across all collision types
            for (const series of barChartData.series) {
              total += series.data[zoneIndex] || 0;

              // For ratio calculation we'll consider the first collision type as reference or
              // calculate based on the most frequent collision type for this zone
              // This is a simplified approach - in practice you might want to calculate
              // the ratio differently based on your specific requirements
              if (series.name === barChartData.series[0].name) {
                specificCollisionAccidents = series.data[zoneIndex];
              }
            }

            // Calculate ratio of specific collision type to total (or use count if total not available)
            const ratio = total > 0 ? specificCollisionAccidents / total : 0;
            return { name: item.name, ratio };
          }

          // If we can't find the zone in bar chart, return with ratio 0
          return { name: item.name, ratio: 0 };
        });
      } else {
        // If no bar chart data available, just convert counts with some normalization
        // Find max count to normalize values to 0-1 range
        const maxCount = Math.max(...countData.map((item) => item.count), 1);
        return countData.map((item: MapDataWithCount) => ({
          name: item.name,
          ratio: item.count / maxCount,
        }));
      }
    }
  }, [mapData, barChartData]);

  // Color scale function: green (low collision ratio) to red (high collision ratio)
  // Handle both percentage (60-70) and decimal (0.6-0.7) values
  const getColor = (ratio: number): string => {
    // Convert percentage to decimal if needed
    const normalizedRatio = ratio > 1 ? ratio / 100 : ratio;

    if (normalizedRatio === 0) return "#E5E7EB"; // Gray for no data
    if (normalizedRatio <= 0.2) return "#10B981"; // Green (low collision ratio)
    if (normalizedRatio <= 0.4) return "#84CC16"; // Light green
    if (normalizedRatio <= 0.6) return "#F59E0B"; // Yellow
    if (normalizedRatio <= 0.8) return "#F97316"; // Orange
    return "#EF4444"; // Red (high collision ratio)
  };

  // Helper function to match zone names flexibly
  const findZoneData = (zoneName: string) => {
    if (!zoneName) return null;

    // Try exact match first with normalized data
    let zoneData = normalizedMapData.find((item) => item.name === zoneName);
    if (zoneData) return zoneData;

    // Try to extract number from zone name and match
    const zoneNumber = zoneName.match(/\d+/)?.[0];
    if (zoneNumber) {
      zoneData = normalizedMapData.find((item) => item.name === zoneNumber);
      if (zoneData) return zoneData;
    }

    // Try fuzzy matching - remove common prefixes/suffixes
    const cleanZoneName = zoneName
      .replace(/^(منطقه|zone|district)\s*/i, "")
      .trim();
    zoneData = normalizedMapData.find((item) => {
      const cleanItemName = item.name
        .replace(/^(منطقه|zone|district)\s*/i, "")
        .trim();
      return cleanItemName === cleanZoneName;
    });
    if (zoneData) return zoneData;

    // Try partial matching
    zoneData = normalizedMapData.find(
      (item) => zoneName.includes(item.name) || item.name.includes(zoneName),
    );

    return zoneData;
  };

  // Style function for GeoJSON features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = (feature?: any) => {
    if (!feature || !feature.properties) return {};
    const zoneName = feature.properties.name;
    const zoneData = findZoneData(zoneName);
    const ratio = zoneData?.ratio || 0;

    return {
      fillColor: getColor(ratio),
      weight: 2,
      opacity: 1,
      color: "#6B7280",
      dashArray: "",
      fillOpacity: 0.7,
      interactive: true,
      className: "zone-polygon",
    };
  };

  // Event handlers for interactive features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: any) => {
    const zoneName = feature.properties?.name || "Unknown";
    const zoneData = findZoneData(zoneName);
    const ratio = zoneData?.ratio || 0;

    // Calculate actual accident count from barChart data
    let totalAccidents = 0;
    let collisionBreakdown = "";
    if (barChartData && barChartData.categories && barChartData.series) {
      // Find the index of this zone in the categories
      let zoneIndex = -1;

      // Try different matching strategies
      const zoneNumber = zoneName.match(/\d+/)?.[0];
      if (zoneNumber) {
        zoneIndex = barChartData.categories.findIndex(
          (cat) => cat === zoneNumber,
        );
      }

      if (zoneIndex === -1) {
        zoneIndex = barChartData.categories.findIndex(
          (cat) => cat === zoneName,
        );
      }

      if (zoneIndex !== -1) {
        // Sum up all accident counts from all series for this zone
        totalAccidents = barChartData.series.reduce((sum, series) => {
          return sum + (series.data[zoneIndex] || 0);
        }, 0);

        // Create breakdown by collision type
        const breakdownItems = barChartData.series
          .map((series) => {
            const count = series.data[zoneIndex] || 0;
            if (count > 0) {
              return `${series.name}: ${count}`;
            }
            return null;
          })
          .filter(Boolean);

        collisionBreakdown = breakdownItems.join("<br/>");
      }
    }

    const ratioDisplay =
      ratio > 1 ? ratio.toFixed(1) : (ratio * 100).toFixed(1);

    // Create popup content with accident count and collision breakdown
    const popupContent = `
      <div style="direction: rtl; text-align: right; font-family: vazir-matn; padding: 12px; min-width: 250px;">
        <h4 style="font-weight: 600; color: #111827; margin-bottom: 8px; font-size: 14px;">${zoneName}</h4>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">تعداد تصادفات:</span>
            <span style="font-weight: 600; color: #111827;">${totalAccidents}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">نسبت برخورد خاص:</span>
            <span style="font-weight: 500; color: #111827;">${ratioDisplay}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">وضعیت برخورد:</span>
            <span style="font-weight: 500; color: ${getColor(ratio)};">
              ${getCollisionLevel(ratio)}
            </span>
          </div>
          ${
            collisionBreakdown
              ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
              <span style="color: #6B7280; font-weight: 500; display: block; margin-bottom: 4px;">تفکیک برخورد:</span>
              <div style="font-size: 12px; color: #374151; line-height: 1.4;">
                ${collisionBreakdown}
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    // Create tooltip for hover with accident count
    const tooltipContent = `${zoneName}: ${totalAccidents} تصادف`;

    // Bind popup and tooltip
    layer.bindPopup(popupContent, {
      direction: "top",
      permanent: false,
      sticky: true,
      opacity: 0.9,
      className: "custom-popup",
    });

    layer.bindTooltip(tooltipContent, {
      direction: "top",
      permanent: false,
      sticky: true,
      opacity: 0.9,
      className: "custom-tooltip",
    });

    // Add mouse events
    layer.on({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseover: function (e: any) {
        const currentLayer = e.target;

        // Highlight on hover
        currentLayer.setStyle({
          weight: 4,
          color: "#1F2937",
          dashArray: "",
          fillOpacity: 0.8,
        });

        // Bring to front and show tooltip
        currentLayer.bringToFront();
        currentLayer.openTooltip();
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseout: function (e: any) {
        const currentLayer = e.target;

        // Reset style
        currentLayer.setStyle(style(feature));
        currentLayer.closeTooltip();
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      click: function (e: any) {
        const currentLayer = e.target;

        // Show popup
        currentLayer.openPopup();

        // Zoom to feature if possible
        try {
          const map = currentLayer._map;
          if (map && currentLayer.getBounds) {
            map.fitBounds(currentLayer.getBounds(), { padding: [20, 20] });
          }
        } catch {
          // Ignore zoom errors
        }
      },
    });
  };

  // Get collision level text based on ratio
  const getCollisionLevel = (ratio: number): string => {
    // Convert percentage to decimal if needed
    const normalizedRatio = ratio > 1 ? ratio / 100 : ratio;

    if (normalizedRatio === 0) return "داده ناموجود";
    if (normalizedRatio <= 0.2) return "پایین";
    if (normalizedRatio <= 0.4) return "متوسط";
    if (normalizedRatio <= 0.6) return "بالا";
    if (normalizedRatio <= 0.8) return "بسیار بالا";
    return "بحرانی";
  };

  // Default center (Ahvaz coordinates)
  const defaultCenter: [number, number] = [31.3183, 48.6706];
  const defaultZoom = 11;

  // Calculate bounds from GeoJSON features
  const mapBounds = useMemo(() => {
    if (!geoJsonData || !geoJsonData.features) {
      return null;
    }

    const validFeatures = geoJsonData.features.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (feature: any) =>
        feature &&
        feature.geometry &&
        feature.geometry.coordinates &&
        Array.isArray(feature.geometry.coordinates) &&
        feature.geometry.coordinates.length > 0,
    );

    if (validFeatures.length === 0) {
      return null;
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validFeatures.forEach((feature: any) => {
      const coordinates = feature.geometry.coordinates;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processCoordinates = (coords: any): void => {
        if (Array.isArray(coords)) {
          if (typeof coords[0] === "number" && typeof coords[1] === "number") {
            const [lng, lat] = coords;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          } else {
            coords.forEach(processCoordinates);
          }
        }
      };

      processCoordinates(coordinates);
    });

    if (
      minLat === Infinity ||
      maxLat === -Infinity ||
      minLng === Infinity ||
      maxLng === -Infinity
    ) {
      return null;
    }

    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ] as [[number, number], [number, number]];
  }, [geoJsonData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">در حال بارگذاری نقشه...</p>
          </div>
        </div>
      </div>
    );
  }

  // No GeoJSON data state
  if (!geoJsonData || !geoJsonData.features) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            نقشه مقایسه مکانی نحوه و نوع برخورد
          </h3>
        </div>
        <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
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
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              نقشه در دسترس نیست
            </h3>
            <p className="text-gray-600">
              داده‌های جغرافیایی برای شهر انتخاب شده موجود نمی‌باشد
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            نقشه مقایسه مکانی نحوه و نوع برخورد
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            توزیع نسبت انواع برخورد در مناطق مختلف شهر
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          {mapData.length} منطقه
        </div>
      </div>

      {/* Map */}
      <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          bounds={mapBounds || undefined}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={style}
              onEachFeature={onEachFeature}
              key={JSON.stringify(mapData)} // Force re-render when data changes
            />
          )}

          <ZoomControl position="topright" />
          <AttributionControl position="bottomright" />
        </MapContainer>
      </div>

      {/* Color Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">راهنمای رنگ‌ها</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: "#10B981" }}
            ></div>
            <span className="text-xs text-gray-600">پایین</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: "#84CC16" }}
            ></div>
            <span className="text-xs text-gray-600">کم</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: "#F59E0B" }}
            ></div>
            <span className="text-xs text-gray-600">متوسط</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: "#F97316" }}
            ></div>
            <span className="text-xs text-gray-600">بالا</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: "#EF4444" }}
            ></div>
            <span className="text-xs text-gray-600">بحرانی</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: "#E5E7EB" }}
            ></div>
            <span className="text-xs text-gray-600">بدون داده</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          رنگ‌ها نسبت نوع برخورد غالب در هر منطقه را نشان می‌دهند. برای اطلاعات
          بیشتر روی مناطق کلیک کنید.
        </p>
      </div>
    </div>
  );
};

export default SpatialCollisionMap;
