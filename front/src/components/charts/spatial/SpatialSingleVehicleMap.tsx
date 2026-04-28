"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const BasemapLayer = dynamic(
  () => import("@/components/maps/BasemapLayer"),
  { ssr: false },
);

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
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

interface SpatialSingleVehicleMapProps {
  mapData: MapData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geoJsonData: any;
  isLoading: boolean;
}

const SpatialSingleVehicleMap: React.FC<SpatialSingleVehicleMapProps> = ({
  mapData,
  geoJsonData,
  isLoading,
}) => {
  // Color scale function: green (low) to yellow to red (high)
  const getColor = (ratio: number): string => {
    // Convert percentage to decimal if needed
    const normalizedRatio = ratio > 1 ? ratio / 100 : ratio;

    if (normalizedRatio === 0) return "#E5E7EB"; // Gray for no data
    if (normalizedRatio <= 0.2) return "#10B981"; // Green (low single-vehicle accident ratio)
    if (normalizedRatio <= 0.4) return "#84CC16"; // Light green
    if (normalizedRatio <= 0.6) return "#F59E0B"; // Yellow
    if (normalizedRatio <= 0.8) return "#F97316"; // Orange
    return "#EF4444"; // Red (high single-vehicle accident ratio)
  };

  // Helper function to match zone names flexibly
  const findZoneData = (zoneName: string) => {
    if (!zoneName) return null;

    // Try exact match first
    let zoneData = mapData.find((item) => item.name === zoneName);
    if (zoneData) return zoneData;

    // Try to extract number from zone name and match
    const zoneNumber = zoneName.match(/\d+/)?.[0];
    if (zoneNumber) {
      zoneData = mapData.find((item) => item.name === zoneNumber);
      if (zoneData) return zoneData;
    }

    // Try fuzzy matching - remove common prefixes/suffixes
    const cleanZoneName = zoneName
      .replace(/^(منطقه|zone|district)\s*/i, "")
      .trim();
    zoneData = mapData.find((item) => {
      const cleanItemName = item.name
        .replace(/^(منطقه|zone|district)\s*/i, "")
        .trim();
      return cleanItemName === cleanZoneName;
    });
    if (zoneData) return zoneData;

    // Try partial matching
    zoneData = mapData.find(
      (item) => zoneName.includes(item.name) || item.name.includes(zoneName),
    );

    return zoneData;
  };

  // Style function for GeoJSON features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = (feature: any) => {
    const zoneName = feature?.properties?.name || "";
    const zoneData = findZoneData(zoneName);
    const ratio = zoneData?.ratio || 0;

    return {
      fillColor: getColor(ratio),
      weight: 2,
      opacity: 1,
      color: "#ffffff",
      dashArray: "",
      fillOpacity: 0.7,
    };
  };

  // Tooltip and interaction handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: any) => {
    const zoneName = feature?.properties?.name || "نامشخص";
    const zoneData = findZoneData(zoneName);
    const ratio = zoneData?.ratio || 0;

    // Format ratio as percentage
    const percentageRatio = ratio > 1 ? ratio : ratio * 100;

    // Get accident level text
    const getAccidentLevel = (ratio: number): string => {
      const normalizedRatio = ratio > 1 ? ratio / 100 : ratio;

      if (normalizedRatio === 0) return "داده ناموجود";
      if (normalizedRatio <= 0.2) return "کم خطر";
      if (normalizedRatio <= 0.4) return "متوسط";
      if (normalizedRatio <= 0.6) return "نسبتاً خطرناک";
      if (normalizedRatio <= 0.8) return "پرخطر";
      return "بسیار پرخطر";
    };

    const tooltipContent = `
      <div style="font-family: inherit; direction: rtl; text-align: right; padding: 8px; min-width: 200px;">
        <strong style="font-size: 14px; color: #1f2937;">${zoneName}</strong><br/>
        <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e5e7eb;">
          <div style="margin-bottom: 2px;">
            <span style="color: #6b7280;">نسبت تصادفات تک وسیله ای:</span><br/>
            <strong style="color: #1f2937;">${percentageRatio.toFixed(1)}%</strong>
          </div>
          <div style="margin-top: 4px;">
            <span style="color: #6b7280;">وضعیت:</span>
            <strong style="color: ${getColor(ratio)};">${getAccidentLevel(ratio)}</strong>
          </div>
        </div>
      </div>
    `;

    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: "top",
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

        // Bring to front
        currentLayer.bringToFront();
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseout: function (e: any) {
        const currentLayer = e.target;

        // Reset style
        currentLayer.setStyle(style(feature));
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
            // This is a coordinate pair [lng, lat]
            const lng = coords[0];
            const lat = coords[1];
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          } else {
            // This is a nested array, process recursively
            coords.forEach(processCoordinates);
          }
        }
      };

      processCoordinates(coordinates);
    });

    if (
      minLat !== Infinity &&
      maxLat !== -Infinity &&
      minLng !== Infinity &&
      maxLng !== -Infinity
    ) {
      return {
        minLat,
        maxLat,
        minLng,
        maxLng,
        center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [
          number,
          number,
        ],
      };
    }

    return null;
  }, [geoJsonData]);

  // Determine map center and zoom
  const mapCenter = mapBounds ? mapBounds.center : defaultCenter;
  const mapZoom = mapBounds ? Math.min(defaultZoom, 13) : defaultZoom;

  // Loading state
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

  // No data state
  if (!geoJsonData) {
    console.log("No GeoJSON data provided");
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          نقشه نسبت تصادفات تک وسیله ای
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
          نقشه نسبت تصادفات تک وسیله ای
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
          نقشه نسبت تصادفات تک وسیله ای
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
    console.log("No valid features found in GeoJSON data");
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          نقشه نسبت تصادفات تک وسیله ای
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">هیچ منطقه معتبری برای نمایش یافت نشد</p>
        </div>
      </div>
    );
  }

  console.log(
    `Rendering map with ${validFeatures.length} valid features out of ${geoJsonData.features.length} total features`,
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          نقشه نسبت تصادفات تک وسیله ای
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
              clipRule="evenodd"
            />
          </svg>
          نقشه کوروپلت
        </div>
      </div>

      <div className="relative">
        <div
          className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
          style={{ position: "relative" }}
        >
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
            preferCanvas={false}
            renderer={undefined}
          >
            <BasemapLayer />

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
          <span className="text-xs text-gray-500">
            نسبت تصادفات تک وسیله ای
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>کم</span>
          </div>
          <div className="flex-1 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded mx-2"></div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>بالا</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Map Statistics */}
      {mapData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {mapData.length}
              </div>
              <div className="text-gray-500">کل مناطق</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">
                {mapData.filter((item) => item.ratio > 0.8).length}
              </div>
              <div className="text-gray-500">مناطق پرخطر</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">
                {
                  mapData.filter(
                    (item) => item.ratio > 0.4 && item.ratio <= 0.8,
                  ).length
                }
              </div>
              <div className="text-gray-500">مناطق متوسط</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {mapData.filter((item) => item.ratio <= 0.4).length}
              </div>
              <div className="text-gray-500">مناطق کم خطر</div>
            </div>
          </div>
        </div>
      )}

      {/* Map Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🗺️ راهنمای نقشه</h4>
          <p className="text-sm text-blue-800">
            این نقشه نسبت تصادفات تک وسیله ای را در مناطق مختلف شهر نشان می‌دهد.
            رنگ‌های قرمز مناطق با نسبت بالای تصادفات تک وسیله ای و رنگ‌های سبز
            مناطق با نسبت کم را نشان می‌دهند. برای مشاهده جزئیات بیشتر، ماوس را
            روی هر منطقه حرکت دهید.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpatialSingleVehicleMap;
