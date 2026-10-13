"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import LeafletSurface, { type LatLng } from "./LeafletSurface";
import MapClickHandler from "@/components/MapClickHandler";

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);

/** GeoJSON `Point` — ترتیب مختصات در سیم **[longitude, latitude]** است. */
export type GeoPoint = {
  type: "Point";
  coordinates: [number, number];
};

export type GeoPointPickerProps = {
  value: GeoPoint | null | undefined;
  onChange: (point: GeoPoint) => void;
  /** پاک‌کردن نقطه. بدون این، دکمهٔ «حذف» نمایش داده نمی‌شود. */
  onClear?: () => void;
  /** جایی که نقشه باز شود، وقتی هنوز نقطه‌ای انتخاب نشده. */
  fallbackCenter: LatLng;
  fallbackZoom?: number;
  /** ارتفاع نقشه؛ پیش‌فرض `LeafletSurface`. */
  className?: string;
  errorMessage?: string;
  label?: string;
  /** رنگ دکمه‌ها — فرم‌های روشنِ قدیمی ظاهر متفاوتی دارند. */
  tone?: "dark" | "light";
};

/**
 * انتخاب یک نقطه روی نقشه.
 *
 * کلیک روی نقشه `[lng, lat]` می‌دهد؛ این همان چیزی است که GeoJSON می‌خواهد.
 * `LatLng` خودِ leaflet `[lat, lng]` است، پس **این جابه‌جایی در همین فایل و
 * فقط همین‌جا انجام می‌شود**. جا افتادنش یعنی مرکز اهواز در اقیانوس هند.
 *
 * کلیک‌گیری تا وقتی کاربر دکمه را نزده است خاموش است تا یک پنل اسکرول یا
 * انتخابِ متن، ناخواسته نقطه را جابه‌جا نکند.
 */
export const GeoPointPicker: React.FC<GeoPointPickerProps> = ({
  value,
  onChange,
  onClear,
  fallbackCenter,
  fallbackZoom = 6,
  className,
  errorMessage,
  label = "انتخاب روی نقشه",
  tone = "dark",
}) => {
  const [isPicking, setIsPicking] = useState(false);

  const handlePick = useCallback(
    (position: LatLng) => {
      onChange({ type: "Point", coordinates: [position.lng, position.lat] });
      setIsPicking(false);
    },
    [onChange],
  );

  // نقطه‌ی ذخیره‌شده `coordinates: [lng, lat]` است؛ leaflet `[lat, lng]` می‌خواهد.
  const markerPosition: LatLng | null = value
    ? { lat: value.coordinates[1], lng: value.coordinates[0] }
    : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-sm font-medium ${tone === "light" ? "text-gray-700" : "text-slate-300"}`}>
          {label}
        </span>
        <div className="flex gap-2">
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isPicking
                ? "bg-amber-500 text-gray-900"
                : tone === "light"
                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  : "bg-slate-700 text-slate-100 hover:bg-slate-600"
            }`}
            onClick={() => setIsPicking((prev) => !prev)}
            type="button"
          >
            {isPicking ? "کلیک روی نقشه…" : "انتخاب نقطه"}
          </button>
          {value && onClear && (
            <button
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              onClick={onClear}
              type="button"
            >
              حذف
            </button>
          )}
        </div>
      </div>

      <LeafletSurface center={markerPosition ?? fallbackCenter} zoom={fallbackZoom} className={className}>
        <MapClickHandler isActive={isPicking} onMapClick={(e) => handlePick(e.latlng)} />
        {markerPosition && (
          <Marker position={[markerPosition.lat, markerPosition.lng]} />
        )}
      </LeafletSurface>

      {markerPosition && markerPosition.lat !== 0 && (
        <p className={`text-xs ${tone === "light" ? "text-gray-600" : "text-slate-400"}`}>
          عرض جغرافیایی: {markerPosition.lat.toFixed(6)} · طول جغرافیایی:{" "}
          {markerPosition.lng.toFixed(6)}
        </p>
      )}
      {errorMessage && (
        <p className="text-xs font-medium text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};

export default GeoPointPicker;
