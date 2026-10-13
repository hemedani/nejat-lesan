"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import LeafletSurface, { type LatLng } from "./LeafletSurface";
import MapClickHandler from "@/components/MapClickHandler";

const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false },
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false },
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false },
);

/** GeoJSON `MultiPolygon` — `coordinates` چهار‌سطحی است. */
export type GeoPolygon = {
  type: "MultiPolygon";
  coordinates: [number, number][][][];
};

export type GeoPolygonDrawerProps = {
  value: GeoPolygon | null | undefined;
  onChange: (polygon: GeoPolygon) => void;
  onClear?: () => void;
  fallbackCenter: LatLng;
  fallbackZoom?: number;
  className?: string;
  errorMessage?: string;
  label?: string;
  /** رنگ و متن دکمه‌ها — فرم‌های روشنِ قدیمی ظاهر متفاوتی دارند. */
  tone?: "dark" | "light";
};

const toLeafletRing = (ring: [number, number][]): [number, number][] =>
  ring.map(([lng, lat]) => [lat, lng]);

const toGeoJsonRing = (points: LatLng[]): [number, number][] => {
  const ring = points.map((p) => [p.lng, p.lat] as [number, number]);
  // حلقه باید بسته باشد: آخرین رأس = اولین رأس. این کارِ `MultiPolygon` است،
  // برخلافِ `GeoLineDrawer` که خطِ باز می‌خواهد.
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push(first);
  }
  return ring;
};

const TONES = {
  dark: {
    start: "bg-amber-500 text-slate-900",
    idle: "bg-slate-700 text-slate-100 hover:bg-slate-600",
    commit: "bg-emerald-600 text-white hover:bg-emerald-700",
    cancel: "bg-slate-600 text-white hover:bg-slate-500",
    clear: "bg-red-600 text-white hover:bg-red-700",
    label: "text-slate-300",
    hint: "text-slate-400",
    draftLine: "#f59e0b",
  },
  light: {
    start: "bg-amber-500 text-gray-900",
    idle: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    commit: "bg-emerald-600 text-white hover:bg-emerald-700",
    cancel: "bg-gray-300 text-gray-800 hover:bg-gray-400",
    clear: "bg-red-600 text-white hover:bg-red-700",
    label: "text-gray-700",
    hint: "text-gray-600",
    draftLine: "#d97706",
  },
} as const;

/**
 * ترسیم یک `MultiPolygon` — محدودهٔ استان، شهر یا شهرستان.
 *
 * این جای `SimpleDrawing` را می‌گیرد که راست‌کلیک برای پایان می‌خواست
 * (روی موبایل وجود ندارد) و هیچ راهی برای ویرایش دوباره نداشت.
 *
 * تفاوت با `GeoLineDrawer`: حلقه **بسته** می‌شود و حداقل چهار رأس لازم
 * دارد (سه رأس + بستن)، چون GeoJSON حلقهٔ کمتر از چهارتا را نامعتبر می‌داند.
 */
export const GeoPolygonDrawer: React.FC<GeoPolygonDrawerProps> = ({
  value,
  onChange,
  onClear,
  fallbackCenter,
  fallbackZoom = 6,
  className,
  errorMessage,
  label = "ترسیم محدوده",
  tone = "dark",
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [draft, setDraft] = useState<LatLng[]>([]);

  const t = TONES[tone];
  // `MultiPolygon.coordinates` آرایه‌ی *چندضلعی‌هاست* و هر کدام آرایه‌ای از
  // حلقه‌ها. اینجا فقط یک حلقه پشتیبانی می‌شود، پس هر محدوده یک حلقه دارد.
  const savedPolygons = useMemo(() => value?.coordinates ?? [], [value]);

  const addVertex = useCallback((position: LatLng) => {
    setDraft((prev) => [...prev, position]);
  }, []);

  const canCommit = draft.length >= 3;

  const commitDraft = useCallback(() => {
    if (!canCommit) return;
    onChange({
      type: "MultiPolygon",
      // یک حلقه، پس یک آرایه دورش: `[[ring]]`.
      coordinates: [...savedPolygons, [toGeoJsonRing(draft)]],
    });
    setDraft([]);
  }, [canCommit, draft, onChange, savedPolygons]);

  const cancelDraft = useCallback(() => {
    setDraft([]);
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    if (!isDrawing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelDraft();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDrawing, cancelDraft]);

  // دابل‌کلیک دو کلیک هم می‌فرستد؛ رأسِ تکراریِ آخر را برمی‌داریم.
  const handleDoubleClick = useCallback(() => {
    setDraft((prev) => {
      if (prev.length < 4) return prev;
      const deduped = prev.slice(0, -1);
      onChange({
        type: "MultiPolygon",
        coordinates: [...savedPolygons, [toGeoJsonRing(deduped)]],
      });
      return [];
    });
  }, [onChange, savedPolygons]);

  const mapCenter = useMemo<LatLng>(() => {
    const firstRing = savedPolygons[0]?.[0];
    const first = firstRing?.[0];
    return first ? { lat: first[1], lng: first[0] } : fallbackCenter;
  }, [savedPolygons, fallbackCenter]);

  const buttonClass = "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-sm font-medium ${t.label}`}>{label}</span>
        <div className="flex flex-wrap gap-2">
          <button
            className={`${buttonClass} ${isDrawing ? t.start : t.idle}`}
            onClick={() => {
              setDraft([]);
              setIsDrawing((prev) => !prev);
            }}
            type="button"
          >
            {isDrawing ? `در حال رسم (${draft.length} رأس)` : "شروع رسم"}
          </button>
          {isDrawing && (
            <>
              <button
                className={`${buttonClass} ${t.commit} disabled:opacity-50`}
                disabled={!canCommit}
                onClick={commitDraft}
                type="button"
              >
                پایان محدوده
              </button>
              <button
                className={`${buttonClass} ${t.cancel}`}
                onClick={cancelDraft}
                type="button"
              >
                انصراف
              </button>
            </>
          )}
          {savedPolygons.length > 0 && onClear && (
            <button
              className={`${buttonClass} ${t.clear}`}
              onClick={onClear}
              type="button"
            >
              حذف محدوده
            </button>
          )}
        </div>
      </div>

      <LeafletSurface
        center={mapCenter}
        className={className}
        zoom={fallbackZoom}
      >
        <MapClickHandler
          isActive={isDrawing}
          onMapClick={(e) => addVertex(e.latlng)}
          onMapDoubleClick={handleDoubleClick}
        />
        {savedPolygons.map((polygon, index) => (
          <Polygon
            key={`polygon-${index}`}
            pathOptions={{ color: "#3b82f6", weight: 2, fillOpacity: 0.15 }}
            positions={toLeafletRing(polygon[0] ?? [])}
          />
        ))}
        {draft.length > 0 && (
          <>
            <Polyline
              pathOptions={{ color: t.draftLine, dashArray: "6 6", weight: 3 }}
              positions={toLeafletRing(
                draft.map((p) => [p.lng, p.lat] as [number, number]),
              )}
            />
            {draft.map((point, index) => (
              <CircleMarker
                center={[point.lat, point.lng]}
                key={`vertex-${index}`}
                pathOptions={{ color: t.draftLine, fillColor: t.draftLine, fillOpacity: 1 }}
                radius={4}
              />
            ))}
          </>
        )}
      </LeafletSurface>

      <p className={`text-xs ${t.hint}`}>
        {isDrawing
          ? "روی نقشه کلیک کنید. برای پایان، «پایان محدوده» را بزنید یا دابل‌کلیک کنید. Esc انصراف است."
          : savedPolygons.length > 0
            ? `${savedPolygons.length} محدوده، ${savedPolygons.reduce((s, p) => s + (p[0]?.length ?? 0), 0)} رأس ثبت شده است.`
            : "محدوده‌ای ثبت نشده است."}
      </p>
      {errorMessage && (
        <p className="text-xs font-medium text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};

export default GeoPolygonDrawer;
