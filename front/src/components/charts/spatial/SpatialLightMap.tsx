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

interface SpatialLightMapProps {
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

const SpatialLightMap: React.FC<SpatialLightMapProps> = ({
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
      // We need to determine what the ratio represents - likely a percentage of some lighting condition
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
            let daytimeAccidents = 0;

            // Calculate total accidents for this zone across all lighting conditions
            for (const series of barChartData.series) {
              total += series.data[zoneIndex] || 0;

              // If this series is 'روز' (day), add to daytime accidents
              if (series.name === "روز") {
                daytimeAccidents = series.data[zoneIndex];
              }
            }

            // Calculate ratio of day accidents to total (or use count if total not available)
            const ratio = total > 0 ? daytimeAccidents / total : 0;
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

  // Color scale function: blue (low) to yellow to orange (high)
  // Handle both percentage (60-70) and decimal (0.6-0.7) values
  const getColor = (ratio: number): string => {
    // Convert percentage to decimal if needed
    const normalizedRatio = ratio > 1 ? ratio / 100 : ratio;

    if (normalizedRatio === 0) return "#E5E7EB"; // Gray for no data
    if (normalizedRatio <= 0.2) return "#3B82F6"; // Blue (low light condition ratio)
    if (normalizedRatio <= 0.4) return "#06B6D4"; // Cyan
    if (normalizedRatio <= 0.6) return "#10B981"; // Green
    if (normalizedRatio <= 0.8) return "#F59E0B"; // Yellow
    return "#F97316"; // Orange (high light condition ratio)
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
      }
    }

    const ratioDisplay =
      ratio > 1 ? ratio.toFixed(1) : (ratio * 100).toFixed(1);

    // Create popup content with accident count
    const popupContent = `
      <div style="direction: rtl; text-align: right; font-family: vazir-matn; padding: 12px; min-width: 200px;">
        <h4 style="font-weight: 600; color: #111827; margin-bottom: 8px; font-size: 14px;">${zoneName}</h4>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">تعداد تصادفات:</span>
            <span style="font-weight: 600; color: #111827;">${totalAccidents}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">نسبت روز:</span>
            <span style="font-weight: 500; color: #111827;">${ratioDisplay}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">وضعیت روشنایی:</span>
            <span style="font-weight: 500; color: ${getColor(ratio)};">
              ${getLightLevel(ratio)}
            </span>
          </div>
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

  // Get light level text based on ratio
  const getLightLevel = (ratio: number): string => {
    // Convert percentage to decimal if needed
    const normalizedRatio = ratio > 1 ? ratio / 100 : ratio;

    if (normalizedRatio === 0) return "داده ناموجود";
    if (normalizedRatio <= 0.2) return "کمتر روشن";
    if (normalizedRatio <= 0.4) return "متوسط";
    if (normalizedRatio <= 0.6) return "روشن";
    if (normalizedRatio <= 0.8) return "بسیار روشن";
    return "کاملاً روشن";
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
            // This is a [lng, lat] pair
            const [lng, lat] = coords;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          } else {
            // This is an array of coordinates, process recursively
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

    // Add some padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    return [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding],
    ] as [[number, number], [number, number]];
  }, [geoJsonData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Enhanced validation for GeoJSON data
  if (!geoJsonData) {
    console.log("No GeoJSON data provided");
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          نقشه وضعیت روشنایی
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">داده‌های نقشه موجود نیست</p>
        </div>
      </div>
    );
  }

  if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
    console.log("Invalid GeoJSON features structure:", geoJsonData);
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          نقشه وضعیت روشنایی
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">ساختار داده‌های نقشه نامعتبر است</p>
        </div>
      </div>
    );
  }

  if (geoJsonData.features.length === 0) {
    console.log("No features found in GeoJSON data");
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          نقشه وضعیت روشنایی
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">هیچ منطقه‌ای برای نمایش یافت نشد</p>
        </div>
      </div>
    );
  }

  // Validate that features have proper geometry
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
    console.log("No valid features with geometry found");
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          نقشه وضعیت روشنایی
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">داده‌های جغرافیایی معتبر یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          نقشه وضعیت روشنایی
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
              clipRule="evenodd"
            />
          </svg>
          نقشه کوروپلث
        </div>
      </div>

      <div className="map-container">
        <div className="map-wrapper">
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            bounds={mapBounds || undefined}
            style={{ height: "100%", width: "100%" }}
            className="leaflet-container"
            scrollWheelZoom={true}
            dragging={true}
            touchZoom={true}
            doubleClickZoom={true}
            zoomControl={false}
            attributionControl={false}
            key={`map-${validFeatures.length}-${JSON.stringify(mapBounds)}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={18}
              minZoom={8}
            />

            {/* Custom positioned zoom control */}
            <ZoomControl position="topright" />

            {/* Custom positioned attribution */}
            <AttributionControl position="bottomleft" prefix={false} />

            <GeoJSON
              data={
                {
                  type: "FeatureCollection",
                  features: validFeatures,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
              }
              style={style}
              onEachFeature={onEachFeature}
              interactive={true}
              bubblingMouseEvents={false}
              key={`geojson-${JSON.stringify(mapData)}-${validFeatures.length}`}
            />
          </MapContainer>
        </div>
      </div>

      {/* Color Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">راهنمای رنگ‌ها</h4>
          <span className="text-xs text-gray-500">نسبت تصادفات در روز</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>کم</span>
          </div>
          <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-orange-500 rounded mx-2"></div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>بالا</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Map Controls Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>کلیک روی مناطق برای جزئیات</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L10 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span>نگه داشتن ماوس برای نمایش اطلاعات</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpatialLightMap;
