"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import LeafletSurface, { type LatLng } from "./LeafletSurface";
import MapClickHandler from "@/components/MapClickHandler";

const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false },
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false },
);

/** GeoJSON `MultiLineString` — `coordinates` سه‌سطحی است. */
export type GeoLineString = {
  type: "MultiLineString";
  coordinates: [number, number][][];
};

export type GeoLineDrawerProps = {
  value: GeoLineString | null | undefined;
  onChange: (line: GeoLineString) => void;
  /** پاک‌کردن کل هندسه. بدون این، دکمهٔ «حذف» نمایش داده نمی‌شود. */
  onClear?: () => void;
  fallbackCenter: LatLng;
  fallbackZoom?: number;
  className?: string;
  errorMessage?: string;
  label?: string;
};

/** GeoJSON سیم `[lng, lat]` است؛ leaflet `[lat, lng]` می‌خواهد. */
const toLeaflet = (line: [number, number][]): [number, number][] =>
  line.map(([lng, lat]) => [lat, lng]);

/** برعکسِ `toLeaflet` — تنها جایی که این جابه‌جایی انجام می‌شود. */
const toGeoJson = (points: LatLng[]): [number, number][] =>
  points.map((p) => [p.lng, p.lat]);

/**
 * ترسیم یک `MultiLineString` — محور یک جاده.
 *
 * تفاوت با `SimpleDrawing` که برای چندضلعی ساخته شده:
 *   - **خط باز است.** هیچ `push` برای بستنِ حلقه انجام نمی‌شود؛ آن کار
 *     مخصوص `MultiPolygon` است و روی محور جاده یعنی وصل‌کردن بندر امام به
 *     اهواز با یک ضلعِ کاذب.
 *   - **دو رأس کافی است**، نه سه.
 *   - **تمام‌کردن با دابل‌کلیک یا دکمه**، نه راست‌کلیک — چون راست‌کلیک در
 *     مرورگر منوی زمینه می‌آورد و روی موبایل وجود ندارد.
 *
 * هر «خط جدید» یک قطعه از `MultiLineString` می‌سازد، پس جاده‌ای که چند
 * قطعه دارد (مثلاً دور جزیره) هم پشتیبانی می‌شود.
 */
export const GeoLineDrawer: React.FC<GeoLineDrawerProps> = ({
  value,
  onChange,
  onClear,
  fallbackCenter,
  fallbackZoom = 6,
  className,
  errorMessage,
  label = "ترسیم روی نقشه",
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  /** رأس‌های قطعه‌ای که الان در حال رسم است. */
  const [draft, setDraft] = useState<LatLng[]>([]);

  // `value?.coordinates ?? []` آرایه‌ی تازه‌ای در هر رندر می‌سازد، و
  // `useCallback` با آن وابستگی ناپایدار می‌گیرد. پس واقعاً memo می‌شود.
  const savedLines = useMemo(() => value?.coordinates ?? [], [value]);

  const addVertex = useCallback(
    (position: LatLng) => {
      setDraft((prev) => [...prev, position]);
    },
    [],
  );

  const commitDraft = useCallback(() => {
    if (draft.length < 2) return;
    onChange({
      type: "MultiLineString",
      coordinates: [...savedLines, toGeoJson(draft)],
    });
    setDraft([]);
  }, [draft, onChange, savedLines]);

  const cancelDraft = useCallback(() => {
    setDraft([]);
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    if (!isDrawing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelDraft();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDrawing, cancelDraft]);

  // دابل‌کلیک معمولاً دو کلیکِ تکی هم می‌فرستد؛ آن دو رأس آخر را برمی‌داریم
  // و فقط یکی نگه می‌داریم، وگرنه هر قطعه یک رأس اضافه می‌گیرد.
  const handleDoubleClick = useCallback(() => {
    setDraft((prev) => {
      if (prev.length < 2) return prev;
      const withoutDuplicate = prev.slice(0, -1);
      onChange({
        type: "MultiLineString",
        coordinates: [...savedLines, toGeoJson(withoutDuplicate)],
      });
      return [];
    });
  }, [onChange, savedLines]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isDrawing
                ? "bg-amber-500 text-slate-900"
                : "bg-slate-700 text-slate-100 hover:bg-slate-600"
            }`}
            onClick={() => {
              setDraft([]);
              setIsDrawing((prev) => !prev);
            }}
            type="button"
          >
            {isDrawing
              ? `رسم قطعهٔ جدید (${draft.length} رأس)`
              : "شروع رسم"}
          </button>
          {isDrawing && (
            <>
              <button
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={draft.length < 2}
                onClick={commitDraft}
                type="button"
              >
                پایان قطعه
              </button>
              <button
                className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-500"
                onClick={cancelDraft}
                type="button"
              >
                انصراف
              </button>
            </>
          )}
          {savedLines.length > 0 && onClear && (
            <button
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              onClick={onClear}
              type="button"
            >
              حذف هندسه
            </button>
          )}
        </div>
      </div>

      <LeafletSurface
        center={
          savedLines[0]?.[0]
            ? { lat: savedLines[0][0][1], lng: savedLines[0][0][0] }
            : fallbackCenter
        }
        className={className}
        zoom={fallbackZoom}
      >
        <MapClickHandler
          isActive={isDrawing}
          onMapClick={(e) => addVertex(e.latlng)}
          onMapDoubleClick={handleDoubleClick}
        />
        {savedLines.map((line, index) => (
          <Polyline
            key={`line-${index}`}
            pathOptions={{ color: "#3b82f6", weight: 3 }}
            positions={toLeaflet(line)}
          />
        ))}
        {draft.length > 0 && (
          <Polyline
            pathOptions={{ color: "#f59e0b", dashArray: "6 6", weight: 3 }}
            positions={toLeaflet(toGeoJson(draft))}
          />
        )}
        {draft.map((point, index) => (
          <CircleMarker
            center={[point.lat, point.lng]}
            key={`vertex-${index}`}
            pathOptions={{
              color: "#f59e0b",
              fillColor: "#f59e0b",
              fillOpacity: 1,
            }}
            radius={4}
          />
        ))}
      </LeafletSurface>

      <p className="text-xs text-slate-400">
        {isDrawing
          ? "روی نقشه کلیک کنید تا رأس اضافه شود. برای پایان، «پایان قطعه» را بزنید یا دابل‌کلیک کنید. Esc انصراف است."
          : savedLines.length > 0
            ? `${savedLines.length} قطعه، ${savedLines.reduce((sum, l) => sum + l.length, 0)} رأس ثبت شده است.`
            : "هندسه‌ای ثبت نشده است."}
      </p>
      {errorMessage && (
        <p className="text-xs font-medium text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};

export default GeoLineDrawer;
