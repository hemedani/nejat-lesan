"use client";

import React, { useMemo } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";

const BasemapLayer = dynamic(
  () => import("@/components/maps/BasemapLayer"),
  { ssr: false },
);

interface SpatialSafetyMapProps {
  mapData: Array<{
    name: string;
    barChartMetric: number;
    mapChartMetric: number;
  }>;
  geoJsonData: {
    type: string;
    features: Array<{
      type: string;
      properties: {
        id: string;
        name: string;
        [key: string]: string | number;
      };
      geometry: {
        type: string;
        coordinates: number[][][] | number[][][][];
      };
    }>;
  } | null;
  isLoading: boolean;
  groupBy: "province" | "city" | "city_zone";
}

const SpatialSafetyMap: React.FC<SpatialSafetyMapProps> = ({
  mapData,
  geoJsonData,
  isLoading,
  groupBy,
}) => {
  // Move all hooks before early returns
  // Create a color scale based on mapChartMetric values
  const colorScale = useMemo(() => {
    if (!mapData || mapData.length === 0) return () => "#e5e7eb";

    const values = mapData
      .map((d) => d.mapChartMetric)
      .filter((v) => !isNaN(v));
    if (values.length === 0) return () => "#e5e7eb";

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    return (value: number) => {
      if (isNaN(value) || range === 0) return "#e5e7eb";

      const normalized = (value - min) / range;

      // Color scale from light yellow to dark red
      if (normalized <= 0.2) return "#FEF3C7"; // very light yellow
      if (normalized <= 0.4) return "#FDE047"; // light yellow
      if (normalized <= 0.6) return "#F97316"; // orange
      if (normalized <= 0.8) return "#DC2626"; // red
      return "#7F1D1D"; // dark red
    };
  }, [mapData]);

  // Create a lookup map for quick data access
  const dataLookup = useMemo(() => {
    if (!mapData) return new Map();

    const lookup = new Map();
    mapData.forEach((item) => {
      lookup.set(item.name, item);
    });
    return lookup;
  }, [mapData]);

  // Calculate map bounds with proper error handling
  const bounds = useMemo(() => {
    if (
      !geoJsonData ||
      !geoJsonData.features ||
      geoJsonData.features.length === 0
    ) {
      // Return undefined when no data - let MapContainer use center/zoom
      return undefined;
    }

    let minLat = Infinity,
      maxLat = -Infinity;
    let minLng = Infinity,
      maxLng = -Infinity;

    let validCoordinatesFound = false;

    geoJsonData.features.forEach((feature) => {
      if (feature.geometry && feature.geometry.coordinates) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const processCoordinates = (coords: any) => {
            if (Array.isArray(coords)) {
              if (
                typeof coords[0] === "number" &&
                typeof coords[1] === "number"
              ) {
                // This is a coordinate pair [lng, lat]
                const [lng, lat] = coords;
                if (
                  !isNaN(lng) &&
                  !isNaN(lat) &&
                  isFinite(lng) &&
                  isFinite(lat)
                ) {
                  minLat = Math.min(minLat, lat);
                  maxLat = Math.max(maxLat, lat);
                  minLng = Math.min(minLng, lng);
                  maxLng = Math.max(maxLng, lng);
                  validCoordinatesFound = true;
                }
              } else if (Array.isArray(coords[0])) {
                // This is an array of coordinates, process recursively
                coords.forEach(processCoordinates);
              }
            }
          };

          processCoordinates(feature.geometry.coordinates);
        } catch (error) {
          console.warn(
            "Error processing coordinates for feature:",
            feature.properties?.name,
            error,
          );
        }
      }
    });

    // If no valid coordinates found or bounds are invalid, return undefined
    if (
      !validCoordinatesFound ||
      minLat === Infinity ||
      maxLat === -Infinity ||
      minLng === Infinity ||
      maxLng === -Infinity ||
      isNaN(minLat) ||
      isNaN(maxLat) ||
      isNaN(minLng) ||
      isNaN(maxLng)
    ) {
      console.warn("Invalid bounds calculated, falling back to center/zoom");
      return undefined;
    }

    // Add some padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1 || 0.1;
    const lngPadding = (maxLng - minLng) * 0.1 || 0.1;

    const calculatedBounds = [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding],
    ] as [[number, number], [number, number]];

    // Validate the calculated bounds
    const isValidBounds = calculatedBounds.every((bound) =>
      bound.every((coord) => !isNaN(coord) && isFinite(coord)),
    );

    return isValidBounds ? calculatedBounds : undefined;
  }, [geoJsonData]);

  // Create legend data
  const legendData = useMemo(() => {
    if (!mapData || mapData.length === 0) return [];

    const values = mapData
      .map((d) => d.mapChartMetric)
      .filter((v) => !isNaN(v));
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);

    return [
      {
        color: "#FEF3C7",
        label: `${min.toFixed(1)} - ${(min + (max - min) * 0.2).toFixed(1)}`,
      },
      {
        color: "#FDE047",
        label: `${(min + (max - min) * 0.2).toFixed(1)} - ${(min + (max - min) * 0.4).toFixed(1)}`,
      },
      {
        color: "#F97316",
        label: `${(min + (max - min) * 0.4).toFixed(1)} - ${(min + (max - min) * 0.6).toFixed(1)}`,
      },
      {
        color: "#DC2626",
        label: `${(min + (max - min) * 0.6).toFixed(1)} - ${(min + (max - min) * 0.8).toFixed(1)}`,
      },
      {
        color: "#7F1D1D",
        label: `${(min + (max - min) * 0.8).toFixed(1)} - ${max.toFixed(1)}`,
      },
    ];
  }, [mapData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: any) => {
    try {
      const featureName = feature?.properties?.name || "نامشخص";
      const data = dataLookup.get(featureName);

      if (data) {
        const tooltipContent = `
          <div class="p-3 min-w-[200px]">
            <h3 class="font-semibold text-gray-900 mb-2">${featureName}</h3>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">نسبت متوفیان به جمعیت:</span>
                <span class="font-medium text-red-600">${!isNaN(data.barChartMetric) ? data.barChartMetric.toFixed(2) : "N/A"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">شاخص ایمنی:</span>
                <span class="font-medium text-blue-600">${!isNaN(data.mapChartMetric) ? data.mapChartMetric.toFixed(2) : "N/A"}</span>
              </div>
            </div>
          </div>
        `;

        layer.bindTooltip(tooltipContent, {
          permanent: false,
          sticky: false,
          className: "custom-tooltip",
          direction: "top",
        });
      } else {
        layer.bindTooltip(
          `
          <div class="p-3">
            <h3 class="font-semibold text-gray-900 mb-2">${featureName}</h3>
            <p class="text-sm text-gray-500">داده‌ای موجود نیست</p>
          </div>
        `,
          {
            permanent: false,
            sticky: false,
            className: "custom-tooltip",
            direction: "top",
          },
        );
      }

      // Add hover effects with error handling
      layer.on({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mouseover: function (e: any) {
          try {
            const layer = e.target;
            if (layer?.setStyle) {
              layer.setStyle({
                weight: 3,
                color: "#374151",
                fillOpacity: 0.8,
              });
            }
          } catch (error) {
            console.warn("Error in mouseover handler:", error);
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mouseout: function (e: any) {
          try {
            const layer = e.target;
            const data = dataLookup.get(featureName);
            const fillColor = data
              ? colorScale(data.mapChartMetric)
              : "#e5e7eb";

            if (layer?.setStyle) {
              layer.setStyle({
                weight: 1,
                color: "#9CA3AF",
                fillOpacity: 0.7,
                fillColor: fillColor,
              });
            }
          } catch (error) {
            console.warn("Error in mouseout handler:", error);
          }
        },
      });
    } catch (error) {
      console.warn("Error in onEachFeature:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geoJsonStyle = (feature: any) => {
    try {
      const featureName = feature?.properties?.name || "";
      const data = dataLookup.get(featureName);
      const fillColor =
        data && !isNaN(data.mapChartMetric)
          ? colorScale(data.mapChartMetric)
          : "#e5e7eb";

      return {
        fillColor: fillColor,
        weight: 1,
        opacity: 1,
        color: "#9CA3AF",
        fillOpacity: 0.7,
      };
    } catch (error) {
      console.warn("Error in geoJsonStyle:", error);
      return {
        fillColor: "#e5e7eb",
        weight: 1,
        opacity: 1,
        color: "#9CA3AF",
        fillOpacity: 0.7,
      };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div
            className="h-96 bg-gray-200 rounded"
            style={{ minHeight: "500px" }}
          ></div>
        </div>
      </div>
    );
  }

  if (
    !geoJsonData ||
    !geoJsonData.features ||
    geoJsonData.features.length === 0
  ) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          نقشه شاخص ایمنی منطقه‌ای
        </h3>
        <div
          className="text-center py-8"
          style={{
            height: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <p className="text-gray-500">داده‌های نقشه موجود نیست</p>
            <p className="text-xs text-gray-400 mt-1">
              لطفاً فیلترهای مختلف را امتحان کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          نقشه شاخص ایمنی منطقه‌ای
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          نقشه حرارتی
        </div>
      </div>

      <div className="relative">
        <div
          className="bg-gray-100 rounded-lg overflow-hidden relative"
          style={{ height: "500px" }}
        >
          {typeof window !== "undefined" ? (
            <MapContainer
              style={{ height: "500px", width: "100%", minHeight: "500px" }}
              center={[32.4279, 53.688]}
              zoom={bounds ? undefined : 6}
              bounds={bounds || undefined}
              className="rounded-lg z-0"
              scrollWheelZoom={true}
              zoomControl={true}
              attributionControl={true}
              key={`map-${geoJsonData?.features?.length || 0}-${groupBy}`}
            >
              <BasemapLayer />

              {geoJsonData &&
                geoJsonData.features &&
                geoJsonData.features.length > 0 && (
                  <GeoJSON
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data={geoJsonData as any}
                    style={geoJsonStyle}
                    onEachFeature={onEachFeature}
                    key={`geojson-${geoJsonData.features.length}-${groupBy}`}
                  />
                )}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">در حال بارگذاری نقشه...</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {legendData.length > 0 && (
          <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs z-[1000] pointer-events-none">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              شاخص ایمنی
            </h4>
            <div className="space-y-1">
              {legendData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs text-gray-700 whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">راهنمای رنگ‌ها</h4>
            <p>
              رنگ‌های روشن‌تر نشان‌دهنده شاخص ایمنی بهتر و رنگ‌های تیره‌تر
              نشان‌دهنده وضعیت بحرانی‌تر هستند.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">نحوه استفاده</h4>
            <p>
              بر روی هر منطقه کلیک کنید تا جزئیات شاخص ایمنی آن منطقه را مشاهده
              کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpatialSafetyMap;
