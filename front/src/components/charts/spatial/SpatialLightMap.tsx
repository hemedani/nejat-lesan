"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { GeoJsonData } from "@/types/GeoJsonTypes";

const BasemapLayer = dynamic(() => import("@/components/maps/BasemapLayer"), { ssr: false });
const BasemapSelector = dynamic(() => import("@/components/maps/BasemapSelector"), { ssr: false });

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });
const ZoomControl = dynamic(() => import("react-leaflet").then((mod) => mod.ZoomControl), {
  ssr: false,
});
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
  const normalizedMapData = useMemo(() => {
    if (barChartData && barChartData.categories && barChartData.series) {
      return mapData.map((item) => {
        const zoneIndex = barChartData.categories.findIndex((cat) => cat === item.name);

        if (zoneIndex !== -1) {
          let insufficientNight = 0;
          let sufficientNight = 0;

          for (const series of barChartData.series) {
            if (series.name === "شب با نور ناکافی") {
              insufficientNight = series.data[zoneIndex] || 0;
            }
            if (series.name === "شب با نور کافی") {
              sufficientNight = series.data[zoneIndex] || 0;
            }
          }

          const totalNight = insufficientNight + sufficientNight;
          return { name: item.name, ratio: totalNight > 0 ? insufficientNight / totalNight : 0 };
        }

        return { name: item.name, ratio: 0 };
      });
    }

    const ratioData = mapData as MapData[];
    if (ratioData.length > 0 && "ratio" in ratioData[0]) {
      return ratioData;
    }

    const countData = mapData as MapDataWithCount[];
    const maxCount = Math.max(...countData.map((item) => item.count), 1);
    return countData.map((item: MapDataWithCount) => ({
      name: item.name,
      ratio: item.count / maxCount,
    }));
  }, [mapData, barChartData]);

  const getColor = (ratio: number): string => {
    const normalizedRatio = ratio > 1 ? ratio / 100 : ratio;

    if (normalizedRatio === 0) return "#E5E7EB";
    if (normalizedRatio <= 0.2) return "#22C55E";
    if (normalizedRatio <= 0.4) return "#84CC16";
    if (normalizedRatio <= 0.6) return "#EAB308";
    if (normalizedRatio <= 0.8) return "#F97316";
    return "#EF4444";
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
    const cleanZoneName = zoneName.replace(/^(منطقه|zone|district)\s*/i, "").trim();
    zoneData = normalizedMapData.find((item) => {
      const cleanItemName = item.name.replace(/^(منطقه|zone|district)\s*/i, "").trim();
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

    let insufficientNightAccidents = 0;
    let sufficientNightAccidents = 0;
    if (barChartData && barChartData.categories && barChartData.series) {
      let zoneIndex = -1;

      const zoneNumber = zoneName.match(/\d+/)?.[0];
      if (zoneNumber) {
        zoneIndex = barChartData.categories.findIndex((cat) => cat === zoneNumber);
      }

      if (zoneIndex === -1) {
        zoneIndex = barChartData.categories.findIndex((cat) => cat === zoneName);
      }

      if (zoneIndex !== -1) {
        for (const series of barChartData.series) {
          if (series.name === "شب با نور ناکافی") {
            insufficientNightAccidents = series.data[zoneIndex] || 0;
          }
          if (series.name === "شب با نور کافی") {
            sufficientNightAccidents = series.data[zoneIndex] || 0;
          }
        }
      }
    }
    const totalNightAccidents = insufficientNightAccidents + sufficientNightAccidents;

    const ratioDisplay = ratio > 1 ? ratio.toFixed(1) : (ratio * 100).toFixed(1);

    const popupContent = `
      <div style="direction: rtl; text-align: right; font-family: vazir-matn; padding: 12px; min-width: 200px;">
        <h4 style="font-weight: 600; color: #111827; margin-bottom: 8px; font-size: 14px;">${zoneName}</h4>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">تصادفات شب با نور ناکافی:</span>
            <span style="font-weight: 600; color: #111827;">${insufficientNightAccidents}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">کل تصادفات شبانه:</span>
            <span style="font-weight: 600; color: #111827;">${totalNightAccidents}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6B7280;">نسبت روشنایی ناکافی:</span>
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

    // Create tooltip for hover with ratio info
    const tooltipContent = `${zoneName}: ${ratioDisplay}% نسبت روشنایی ناکافی`;

    // Bind popup and tooltip
    layer.bindPopup(popupContent, {
      autoPan: true,
      keepInView: true,
      maxWidth: 300,
      className: "custom-popup",
    });

    layer.bindTooltip(tooltipContent, {
      direction: "top",
      sticky: false,
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

  const getLightLevel = (ratio: number): string => {
    const normalizedRatio = ratio > 1 ? ratio / 100 : ratio;

    if (normalizedRatio === 0) return "داده ناموجود";
    if (normalizedRatio <= 0.2) return "روشنایی کافی";
    if (normalizedRatio <= 0.4) return "روشنایی نسبتاً کافی";
    if (normalizedRatio <= 0.6) return "روشنایی متوسط";
    if (normalizedRatio <= 0.8) return "روشنایی ناکافی";
    return "روشنایی بسیار ناکافی";
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

    if (minLat === Infinity || maxLat === -Infinity || minLng === Infinity || maxLng === -Infinity) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نقشه وضعیت روشنایی</h3>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نقشه وضعیت روشنایی</h3>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نقشه وضعیت روشنایی</h3>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نقشه وضعیت روشنایی</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">داده‌های جغرافیایی معتبر یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">نقشه وضعیت روشنایی</h3>
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
            <BasemapLayer />
            <div className="absolute top-4 left-4 z-[1000]">
              <BasemapSelector />
            </div>

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

      {/* Map Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>روشنایی کافی (۰-۲۰٪)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-lime-500 rounded-full"></div>
            <span>روشنایی نسبتاً کافی (۲۰-۴۰٪)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>روشنایی متوسط (۴۰-۶۰٪)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>روشنایی ناکافی (۶۰-۸۰٪)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>روشنایی بسیار ناکافی (۸۰-۱۰۰٪)</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
          <p className="font-semibold mb-1">نحوه تحلیل نقشه کوروپلث:</p>
          <p>این نقشه مناطق شهری را بر اساس نسبت تصادفات شبانه با روشنایی ناکافی به کل تصادفات شبانه رنگ‌بندی می‌کند:</p>
          <div className="mt-2 mb-2 p-2 bg-white/50 rounded text-center font-mono text-blue-900" dir="ltr">
            نسبت نور ناکافی = <span className="text-red-600">شب با نور ناکافی</span> ÷ (<span className="text-red-600">شب با نور ناکافی</span> + <span className="text-green-600">شب با نور کافی</span>)
          </div>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>مناطق سبز = درصد پایین تصادفات با روشنایی ناکافی (روشنایی مطلوب)</li>
            <li>مناطق قرمز = درصد بالای تصادفات با روشنایی ناکافی (نیاز به بهبود)</li>
            <li>هرچه منطقه قرمزتر باشد، وضعیت روشنایی معابر ضعیف‌تر است</li>
            <li>هرچه منطقه سبزتر باشد، شرایط روشنایی معابر بهتر است</li>
            <li>مناطق قرمز و نارنجی نیاز به اولویت‌بندی برای بهبود روشنایی معابر دارند</li>
            <li>کلیک روی هر منطقه جزئیات دقیق شامل تعداد تصادفات با/بدون روشنایی کافی را نمایش می‌دهد</li>
            <li>نگه داشتن ماوس روی منطقه اطلاعات سریع را نشان می‌دهد</li>
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

export default SpatialLightMap;
