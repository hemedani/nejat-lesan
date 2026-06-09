"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useCallback, useState, useId } from "react";

import { accidentSchema } from "@/types/declarations/selectInp";
import { GeoJsonData } from "@/types/GeoJsonTypes";

interface NeshanMapContainerProps {
  center: [number, number];
  zoom: number;
  style?: React.CSSProperties;
  className?: string;
  accidents?: accidentSchema[];
  geoJsonData?: GeoJsonData | null;
  geoJsonStyle?: (feature?: Record<string, unknown>) => Record<string, unknown>;
  onEachFeature?: (feature: Record<string, unknown>, layer: unknown) => void;
  onShapeDrawn?: (geoJSON: GeoJSON.Feature, layer?: { getRadius?(): number }) => void;
  onZoomChange?: (zoom: number) => void;
  isLoading?: boolean;
}

const CSS_URL = "https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.css";
const JS_URL = "https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js";

const NESHAN_API_KEY = process.env.NEXT_PUBLIC_NESHAN_API_KEY || "";

let sdkLoadPromise: Promise<void> | null = null;
let neshanL: unknown = null;

function loadNeshanSDK(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    if (typeof document === "undefined") return;

    // Temporarily hide the npm Leaflet's L so the Neshan SDK
    // creates its own clean L without modifying the npm one.
    let originalWindowL: unknown;
    if (typeof window !== "undefined") {
      originalWindowL = (window as unknown as Record<string, unknown>).L;
      delete (window as unknown as Record<string, unknown>).L;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_URL;
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = JS_URL;
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined") {
        neshanL = (window as unknown as Record<string, unknown>).L;
      }
      // Restore the original npm Leaflet's L
      if (typeof window !== "undefined" && originalWindowL !== undefined) {
        (window as unknown as Record<string, unknown>).L = originalWindowL;
      }
      resolve();
    };
    script.onerror = () => {
      console.error("Neshan SDK script failed to load:", JS_URL);
      // Restore even on error
      if (typeof window !== "undefined" && originalWindowL !== undefined) {
        (window as unknown as Record<string, unknown>).L = originalWindowL;
      }
      sdkLoadPromise = null;
      reject(new Error("Failed to load Neshan SDK"));
    };
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
}

// --- Feature helpers ---

function getMarkerColor(accident: accidentSchema): string {
  switch (accident.type?.name) {
    case "فوتی": return "#EF4444";
    case "جرحی": return "#F97316";
    case "خسارتی": return "#EAB308";
    default: return "#6B7280";
  }
}

function getSeverityWeight(accident: accidentSchema): number {
  if (accident.type?.name === "فوتی") return 3;
  if (accident.type?.name === "جرحی") return 2;
  return 1;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return "نامشخص";
  try {
    return new Date(date).toLocaleDateString("fa-IR");
  } catch {
    return "نامشخص";
  }
}

function buildPopupHtml(a: accidentSchema, clusterSize?: number): string {
  const typeColor =
    a.type?.name === "فوتی" ? "text-red-600"
    : a.type?.name === "جرحی" ? "text-orange-600"
    : a.type?.name === "خسارتی" ? "text-yellow-600"
    : "text-gray-600";

  return `
    <div class="p-2 max-w-xs" dir="rtl">
      <h3 class="font-semibold text-lg mb-2 text-gray-800">جزئیات تصادف</h3>
      <div class="space-y-1 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">سریال:</span>
          <span class="font-medium">${a.serial || ""}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">تاریخ:</span>
          <span class="font-medium">${formatDate(a.date_of_accident)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">نوع:</span>
          <span class="font-medium ${typeColor}">${a.type?.name || "نامشخص"}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">فوتی:</span>
          <span class="font-medium text-red-600">${a.dead_count || 0}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">مجروح:</span>
          <span class="font-medium text-orange-600">${a.injured_count || 0}</span>
        </div>
        ${clusterSize && clusterSize > 1 ? `
        <div class="flex justify-between">
          <span class="text-gray-600">تعداد تصادفات:</span>
          <span class="font-medium text-blue-600">${clusterSize}</span>
        </div>` : ""}
        ${a.collision_type?.name ? `
        <div class="flex justify-between">
          <span class="text-gray-600">نوع برخورد:</span>
          <span class="font-medium">${a.collision_type.name}</span>
        </div>` : ""}
        ${a.light_status?.name ? `
        <div class="flex justify-between">
          <span class="text-gray-600">وضعیت نور:</span>
          <span class="font-medium">${a.light_status.name}</span>
        </div>` : ""}
      </div>
    </div>
  `;
}

function addClusteredMarkers(map: any, accidents: accidentSchema[]) {
  const L = neshanL as any;
  const group = L.layerGroup();
  const currentZoom = map.getZoom();

  const gridSize = Math.max(0.0005, 0.05 / Math.pow(1.8, currentZoom - 6));
  const grid: Record<string, accidentSchema[]> = {};

  accidents.forEach((accident) => {
    const coords = accident.location?.coordinates;
    if (!coords || coords.length < 2) return;
    const lat = coords[1];
    const lng = coords[0];
    const key = `${Math.floor(lat / gridSize)},${Math.floor(lng / gridSize)}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(accident);
  });

  Object.values(grid).forEach((cellAccidents) => {
    const count = cellAccidents.length;
    const totalLat = cellAccidents.reduce((s, a) => s + (a.location?.coordinates?.[1] || 0), 0);
    const totalLng = cellAccidents.reduce((s, a) => s + (a.location?.coordinates?.[0] || 0), 0);
    const center: [number, number] = [totalLat / count, totalLng / count];

    const mostSevere = cellAccidents.reduce((worst, a) =>
      getSeverityWeight(a) > getSeverityWeight(worst) ? a : worst,
    );

    const color = getMarkerColor(mostSevere);

    if (count === 1 || currentZoom >= 16) {
      const marker = L.circleMarker(center, {
        radius: 7,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });
      const a = cellAccidents[0];
      marker.bindPopup(buildPopupHtml(a, count > 1 ? count : undefined));
      group.addLayer(marker);
    } else {
      const clusterRadius = Math.min(26, Math.max(12, 8 + count * 1.5));
      const marker = L.circleMarker(center, {
        radius: clusterRadius,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });
      const representative = cellAccidents[0];
      marker.bindPopup(buildPopupHtml(representative, count));
      group.addLayer(marker);
    }
  });

  map.addLayer(group);
  return group;
}

function addMarkers(map: any, accidents: accidentSchema[]) {
  return addClusteredMarkers(map, accidents);
}

function addHeatmap(map: any, accidents: accidentSchema[]) {
  const group = (neshanL as any).layerGroup();

  accidents.forEach((accident) => {
    const coords = accident.location?.coordinates;
    if (!coords || coords.length < 2) return;

    const lat = coords[1];
    const lng = coords[0];
    const weight = getSeverityWeight(accident);
    const radius = 8 + weight * 6;
    const opacity = 0.15 + weight * 0.15;

    const circle = (neshanL as any).circleMarker([lat, lng], {
      radius,
      fillColor: "#ff4444",
      color: "#ff4444",
      weight: 0,
      fillOpacity: opacity,
    });

    group.addLayer(circle);
  });

  map.addLayer(group);
  return group;
}

function addGeoJSONLayer(
  map: any,
  data: GeoJsonData,
  style?: (feature?: Record<string, unknown>) => Record<string, unknown>,
  onEachFeature?: (feature: Record<string, unknown>, layer: unknown) => void,
  fitBounds = false,
) {
  const layer = (neshanL as any).geoJSON(data, {
    style: style || (() => ({
      fillColor: "#3b82f6",
      weight: 2,
      opacity: 1,
      color: "#1d4ed8",
      fillOpacity: 0.1,
    })),
    onEachFeature,
  });

  map.addLayer(layer);

  if (fitBounds && data.features?.length) {
    try {
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    } catch {
      // ignore fitBounds errors
    }
  }

  return layer;
}

function setupDrawing(map: any, onShapeDrawn: (geoJSON: GeoJSON.Feature, layer?: { getRadius?(): number }) => void, containerEl: HTMLElement | null) {
  const points: Array<{ lat: number; lng: number }> = [];
  const markers: Array<ReturnType<any>> = [];
  let polygon: ReturnType<any> | null = null;
  let isDrawing = false;

  const addPointCounter = () => {
    const control = new (neshanL as any).Control({ position: "topleft" });
    control.onAdd = function () {
      const div = (neshanL as any).DomUtil.create("div", "neshan-point-counter");
      div.style.cssText = "background:rgba(59,130,246,0.9);color:white;padding:8px 12px;border:2px solid #3b82f6;border-radius:8px;font-size:14px;font-weight:bold;";
      div.innerHTML = "نقاط: 0";
      return div;
    };
    map.addControl(control);
    return control;
  };

  const updateCounter = (count: number) => {
    const el = document.querySelector(".neshan-point-counter") as HTMLElement;
    if (el) el.innerHTML = `نقاط: ${count}`;
  };

  const cleanupDrawing = () => {
    markers.forEach((m: ReturnType<any>) => map.removeLayer(m));
    markers.length = 0;
    if (polygon) {
      map.removeLayer(polygon);
      polygon = null;
    }
    isDrawing = false;
    points.length = 0;
    updateCounter(0);
  };

  const counter = addPointCounter();

  const L = (neshanL as any);

  const handleClick = (e: { latlng: { lat: number; lng: number } }) => {
    if (!isDrawing) {
      isDrawing = true;
      points.push(e.latlng);
      const marker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 5,
        fillColor: "#ef4444",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);
      markers.push(marker);
      updateCounter(1);
    } else {
      points.push(e.latlng);
      const marker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 5,
        fillColor: "#ef4444",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);
      markers.push(marker);
      updateCounter(points.length);

      if (polygon) map.removeLayer(polygon);
      if (points.length >= 2) {
        polygon = L.polygon(points, {
          color: "#3b82f6",
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.1,
          fillColor: "#3b82f6",
        }).addTo(map);
      }
    }
  };

  const handleRightClick = (e: { originalEvent?: Event }) => {
    e.originalEvent?.preventDefault();
    if (isDrawing && points.length >= 3) {
      markers.forEach((m: ReturnType<any>) => map.removeLayer(m));
      markers.length = 0;
      if (polygon) map.removeLayer(polygon);
      const finalPolygon = L.polygon(points, {
        color: "#3b82f6",
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.2,
        fillColor: "#3b82f6",
      }).addTo(map);
      polygon = finalPolygon;
      onShapeDrawn(finalPolygon.toGeoJSON(), finalPolygon);
      isDrawing = false;
      points.length = 0;
      updateCounter(0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    const target = e.target as HTMLElement | null;
    // Only handle Escape if it targets the map container — otherwise a modal is open
    if (containerEl && (!target || !containerEl.contains(target))) return;
    cleanupDrawing();
  };

  map.on("click", handleClick);
  map.on("contextmenu", handleRightClick);
  document.addEventListener("keydown", handleKeyDown);

  return () => {
    map.off("click", handleClick);
    map.off("contextmenu", handleRightClick);
    document.removeEventListener("keydown", handleKeyDown);
    map.removeControl(counter);
    cleanupDrawing();
  };
}

// --- Component ---

const NeshanMapContainer: React.FC<NeshanMapContainerProps> = ({
  center,
  zoom,
  style,
  className,
  accidents,
  geoJsonData,
  geoJsonStyle,
  onEachFeature,
  onShapeDrawn,
  onZoomChange,
  isLoading,
}) => {
  const uniqueId = useId();
  const mapContainerId = `neshan-map-${uniqueId.replace(/[:.]/g, "-")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<any> | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [localViewMode, setLocalViewMode] = useState<"heatmap" | "dots">("heatmap");
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [reclusterKey, setReclusterKey] = useState(0);
  const featureLayersRef = useRef<ReturnType<any>[]>([]);

  const clearFeatureLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    featureLayersRef.current.forEach((layer) => {
      try { map.removeLayer(layer); } catch { /* ignore */ }
    });
    featureLayersRef.current = [];
  }, []);

  const initMap = useCallback(async () => {
    if (!NESHAN_API_KEY) {
      setSdkError("API key is not configured");
      return;
    }

    try {
      await loadNeshanSDK();

      if (mapRef.current) return;

      const L = neshanL as any;
      if (!L || typeof L.Map !== "function") {
        setSdkError("SDK loaded but L.Map is not available");
        return;
      }

      const map = new L.Map(mapContainerId, {
        key: NESHAN_API_KEY,
        maptype: "dreamy",
        center: center,
        zoom: zoom,
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        attributionControl: true,
      });

      // Add zoom control at top-right to avoid overlap with basemap selector
      L.control.zoom({ position: "topright" }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    } catch (err) {
      console.error("Neshan map initialization error:", err);
      setSdkError(
        err instanceof Error ? err.message : "Unknown initialization error",
      );
    }
    // Only recreate map when container ID changes (e.g. component remount)
    // center/zoom are updated via the separate setView effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapContainerId]);

  // Initialize map
  useEffect(() => {
    initMap();

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore cleanup errors
        }
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [initMap]);

  // Sync center/zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setView(center, zoom);
    } catch {
      // ignore
    }
  }, [center, zoom]);

  // Track the previous geoJsonData reference to only fitBounds on data change, not on zoom re-cluster
  const prevGeoJsonRef = useRef<GeoJsonData | null>(null);

  // Add/update features when props change or map becomes ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const isNewGeoJson = geoJsonData !== prevGeoJsonRef.current;
    prevGeoJsonRef.current = geoJsonData;

    clearFeatureLayers();

    // Add GeoJSON first so it sits below markers
    if (geoJsonData) {
      const layer = addGeoJSONLayer(map, geoJsonData, geoJsonStyle, onEachFeature, isNewGeoJson);
      featureLayersRef.current.push(layer);
    }

    // Markers/heatmap on top so they are clickable
    if (localViewMode === "heatmap" && accidents && accidents.length > 0) {
      const layer = addHeatmap(map, accidents);
      featureLayersRef.current.push(layer);
    } else if (accidents && accidents.length > 0) {
      const layer = addMarkers(map, accidents);
      featureLayersRef.current.push(layer);
    }
  }, [accidents, geoJsonData, localViewMode, mapReady, clearFeatureLayers, reclusterKey, isLoading, geoJsonStyle, onEachFeature]);

  // Re-cluster markers on zoom change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const handler = () => setReclusterKey((k) => k + 1);
    map.on("zoomend", handler);
    return () => {
      map.off("zoomend", handler);
    };
  }, [mapReady]);

  // Stable ref for onShapeDrawn to avoid re-running effect on page re-renders
  const onShapeDrawnRef = useRef(onShapeDrawn);
  onShapeDrawnRef.current = onShapeDrawn;

  // Setup drawing controls (opt-in via drawingEnabled)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !onShapeDrawnRef.current || !drawingEnabled) return;

    const cleanupDrawing = setupDrawing(map, onShapeDrawnRef.current, containerRef.current);
    return cleanupDrawing;
  }, [mapReady, drawingEnabled, onShapeDrawnRef, containerRef]);

  // Zoom change handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !onZoomChange) return;

    const handler = () => onZoomChange(map.getZoom());
    map.on("zoomend", handler);
    return () => {
      map.off("zoomend", handler);
    };
  }, [onZoomChange, mapReady]);

  if (!NESHAN_API_KEY) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-500">
        <p>Neshan API key is not configured. Set NEXT_PUBLIC_NESHAN_API_KEY in .env.local</p>
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-500">
        <p>Failed to load Neshan map: {sdkError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">در حال بارگیری نقشه...</p>
          </div>
        </div>
      )}

      <div className="absolute top-16 left-4 z-[1000] flex flex-col gap-2">
        {accidents && accidents.length > 0 && (
          <button
            onClick={() => setLocalViewMode(localViewMode === "heatmap" ? "dots" : "heatmap")}
            className="bg-white text-gray-800 px-5 py-2.5 rounded-lg shadow-lg hover:bg-gray-100 transition-colors font-medium text-sm"
          >
            {localViewMode === "heatmap" ? "تغییر به نمایش نقاط" : "تغییر به نمایش حرارتی"}
          </button>
        )}

        {onShapeDrawn && (
          <button
            onClick={() => setDrawingEnabled(!drawingEnabled)}
            className={`px-5 py-2.5 rounded-lg shadow-lg transition-colors font-medium text-sm ${
              drawingEnabled
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            {drawingEnabled ? "لغو رسم چندضلعی" : "رسم چندضلعی"}
          </button>
        )}
      </div>

      <div
        id={mapContainerId}
        ref={containerRef}
        className={className}
        style={{
          height: "100%",
          width: "100%",
          ...style,
        }}
      />
    </div>
  );
};

export default NeshanMapContainer;
