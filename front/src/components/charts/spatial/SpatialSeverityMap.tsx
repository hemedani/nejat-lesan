"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";
import { GeoJsonData } from "@/types/GeoJsonTypes";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const BasemapSelector = dynamic(() => import("@/components/maps/BasemapSelector"), { ssr: false });
const BasemapLayer = dynamic(() => import("@/components/maps/BasemapLayer"), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });

interface MapData {
  zoneId: string;
  zoneName: string;
  ratio: number;
}

interface SpatialSeverityMapProps {
  mapData: MapData[];
  geoJsonData: GeoJsonData | null;
  isLoading: boolean;
}

const SpatialSeverityMap: React.FC<SpatialSeverityMapProps> = ({
  mapData,
  geoJsonData,
  isLoading,
}) => {
  const [mapError, setMapError] = React.useState<string | null>(null);

  // Effect to catch any rendering errors with the map data
  React.useEffect(() => {
    setMapError(null);
    try {
      // Validate mapData structure
      if (mapData && Array.isArray(mapData)) {
        const invalidItems = mapData.filter(
          (item) => !item || typeof item.zoneName !== "string" || item.zoneName.trim() === "",
        );
        if (invalidItems.length > 0) {
          console.warn("Found invalid map data items:", invalidItems);
        }
      }
    } catch (error) {
      console.error("Map data validation error:", error);
      setMapError("خطا در اعتبارسنجی داده‌های نقشه");
    }
  }, [mapData, geoJsonData]);
  // Color scale function: green (low) to yellow to red (high)
  const getColor = (ratio: number): string => {
    if (ratio === 0) return "#E5E7EB"; // Gray for no data
    if (ratio <= 0.2) return "#10B981"; // Green
    if (ratio <= 0.4) return "#84CC16"; // Light green
    if (ratio <= 0.6) return "#F59E0B"; // Yellow
    if (ratio <= 0.8) return "#F97316"; // Orange
    return "#EF4444"; // Red
  };

  // Helper function to match zone names flexibly
  const findZoneData = (zoneName: string) => {
    if (!zoneName || !mapData || mapData.length === 0) return null;

    // Try exact match first
    let zoneData = mapData.find((item) => item.zoneName && item.zoneName === zoneName);
    if (zoneData) return zoneData;

    // Try to extract number from zone name and match
    const zoneNumber = zoneName.match(/\d+/)?.[0];
    if (zoneNumber) {
      zoneData = mapData.find((item) => item.zoneName && item.zoneName === zoneNumber);
      if (zoneData) return zoneData;
    }

    // Try fuzzy matching - remove common prefixes/suffixes
    const cleanZoneName = zoneName.replace(/^(منطقه|zone|district)\s*/i, "").trim();
    zoneData = mapData.find((item) => {
      if (!item.zoneName) return false;
      const cleanItemName = item.zoneName.replace(/^(منطقه|zone|district)\s*/i, "").trim();
      return cleanItemName === cleanZoneName;
    });
    if (zoneData) return zoneData;

    // Try partial matching
    zoneData = mapData.find(
      (item) =>
        item.zoneName && (zoneName.includes(item.zoneName) || item.zoneName.includes(zoneName)),
    );

    return zoneData;
  };

  // Style function for GeoJSON features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = (feature?: any) => {
    if (!feature || !feature.properties)
      return {
        fillColor: "#E5E7EB",
        weight: 2,
        opacity: 1,
        color: "#6B7280",
        dashArray: "",
        fillOpacity: 0.7,
      };

    const zoneName = feature.properties.name;
    if (!zoneName || typeof zoneName !== "string")
      return {
        fillColor: "#E5E7EB",
        weight: 2,
        opacity: 1,
        color: "#6B7280",
        dashArray: "",
        fillOpacity: 0.7,
      };

    const zoneData = findZoneData(zoneName);
    const ratio = zoneData?.ratio || 0;

    return {
      fillColor: getColor(ratio),
      weight: 2,
      opacity: 1,
      color: "#6B7280",
      dashArray: "",
      fillOpacity: 0.7,
    };
  };

  // Event handlers for interactive features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: any) => {
    if (!feature || !feature.properties || !layer) return;

    const zoneName = feature.properties?.name || "Unknown";
    if (typeof zoneName !== "string") return;

    const zoneData = findZoneData(zoneName);
    const ratio = zoneData?.ratio || 0;

    // Popup content
    const popupContent = `
      <div class="p-3 min-w-48">
        <h4 class="font-semibold text-gray-900 mb-2">${zoneName}</h4>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">نسبت شدت:</span>
            <span class="font-medium">${(ratio * 100).toFixed(1)}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">سطح خطر:</span>
            <span class="font-medium" style="color: ${getColor(ratio)}">
              ${getRiskLevel(ratio)}
            </span>
          </div>
          ${
            zoneData
              ? `<div class="flex justify-between">
            <span class="text-gray-600">شناسه منطقه:</span>
            <span class="font-medium">${zoneData.zoneId}</span>
          </div>`
              : ""
          }
        </div>
      </div>
    `;

    layer.bindPopup(popupContent, {
      autoPan: true,
      keepInView: true,
      maxWidth: 300,
      className: "custom-popup",
    });

    // Hover effects
    layer.on({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseover: (e: any) => {
        const eventLayer = e.target;
        eventLayer.setStyle({
          weight: 3,
          color: "#374151",
          dashArray: "",
          fillOpacity: 0.9,
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseout: (e: any) => {
        const eventLayer = e.target;
        eventLayer.setStyle(style(feature));
      },
    });
  };

  // Get risk level text based on ratio
  const getRiskLevel = (ratio: number): string => {
    if (ratio === 0) return "داده ناموجود";
    if (ratio <= 0.2) return "کم";
    if (ratio <= 0.4) return "متوسط";
    if (ratio <= 0.6) return "بالا";
    if (ratio <= 0.8) return "بسیار بالا";
    return "بحرانی";
  };

  // Syncs map bounds with geoJsonData changes
  const FitBoundsOnGeoJsonChange = ({ geoJsonData }: { geoJsonData: GeoJsonData | null }) => {
    const map = useMap();
    const prevGeoJsonDataRef = React.useRef<GeoJsonData | null>(geoJsonData);

    React.useEffect(() => {
      if (geoJsonData === prevGeoJsonDataRef.current) return;
      prevGeoJsonDataRef.current = geoJsonData;

      const bounds = getBounds(geoJsonData);
      if (bounds) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }, [geoJsonData, map]);

    return null;
  };

  // Default center (Tehran coordinates)
  const defaultCenter: [number, number] = [35.6892, 51.389];
  const defaultZoom = 11;

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

  if (
    !geoJsonData ||
    !geoJsonData.features ||
    !Array.isArray(geoJsonData.features) ||
    geoJsonData.features.length === 0
  ) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نقشه سهم شدت تصادفات</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">داده‌های نقشه موجود نیست</p>
        </div>
      </div>
    );
  }

  // Calculate bounds for the map if GeoJSON data is available
  const getBounds = (geoJsonData: GeoJsonData | null): [[number, number], [number, number]] | null => {
    if (!geoJsonData || !geoJsonData.features) return null;

    try {
      const features = geoJsonData.features;
      let minLat = Infinity,
        maxLat = -Infinity;
      let minLng = Infinity,
        maxLng = -Infinity;

      features.forEach((feature: Record<string, unknown>) => {
        if (feature.geometry && typeof feature.geometry === "object" && feature.geometry !== null) {
          const geometry = feature.geometry as { coordinates: unknown };
          if (geometry.coordinates) {
            const coords = geometry.coordinates;
            const flatCoords = Array.isArray(coords) ? coords.flat(3) : [];

            for (let i = 0; i < flatCoords.length; i += 2) {
              const lng = flatCoords[i];
              const lat = flatCoords[i + 1];

              if (typeof lng === "number" && typeof lat === "number") {
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
              }
            }
          }
        }
      });

      if (minLat !== Infinity && maxLat !== -Infinity && minLng !== Infinity && maxLng !== -Infinity) {
        return [
          [minLat, minLng],
          [maxLat, maxLng],
        ];
      }
    } catch (error) {
      console.warn("Error calculating bounds:", error);
    }

    return null;
  };

  const bounds = getBounds(geoJsonData);
  const mapCenter = bounds
    ? ([(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2] as [number, number])
    : defaultCenter;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">نقشه سهم شدت تصادفات</h3>
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

      <div className="relative h-96 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={mapCenter}
          zoom={defaultZoom}
          style={{ height: "100%", width: "100%" }}
          bounds={bounds ? (bounds as [[number, number], [number, number]]) : undefined}
        >
          <BasemapLayer />
          <div className="absolute top-4 left-4 z-[1000]">
            <BasemapSelector />
          </div>
          <FitBoundsOnGeoJsonChange geoJsonData={geoJsonData} />
          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="text-center p-4">
                <p className="text-red-600 font-medium">خطا در بارگذاری نقشه</p>
                <p className="text-sm text-gray-500 mt-1">{mapError}</p>
              </div>
            </div>
          ) : (
            <GeoJSON
              data={geoJsonData}
              style={style}
              onEachFeature={onEachFeature}
              key={JSON.stringify(geoJsonData)}
            />
          )}
        </MapContainer>
      </div>

      {/* Color Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">راهنمای رنگ‌ها</h4>
          <span className="text-xs text-gray-500">نسبت شدت تصادفات</span>
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

      {/* Map Analysis Explanation */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800 leading-relaxed">
          <p className="font-semibold mb-1">نحوه تحلیل نقشه:</p>
          <p>
            این نقشه نسبت تصادفات فوتی به کل تصادفات شدید (فوتی + جرحی) را در هر منطقه نشان می‌دهد:
          </p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>رنگ سبز = نسبت پایین فوتی (مناطق نسبتاً ایمن‌تر)</li>
            <li>رنگ قرمز = نسبت بالای فوتی (مناطق بحرانی نیازمند مداخله فوری)</li>
            <li>با کلیک روی هر منطقه، درصد دقیق و سطح خطر نمایش داده می‌شود</li>
            <li>اولویت بهبود زیرساخت با مناطقی است که رنگ نارنجی و قرمز دارند</li>
          </ul>
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

export default SpatialSeverityMap;
