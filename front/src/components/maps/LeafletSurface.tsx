"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { ensureLeafletIcons } from "./leafletSetup";

// `react-leaflet` به `window` نیاز دارد، پس هیچ‌کدام از این‌ها نباید در سرور
// رندر شوند. هر فرمِ قبلی این سه خط را جدا تکرار می‌کرد.
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const BasemapLayer = dynamic(() => import("@/components/maps/BasemapLayer"), {
  ssr: false,
});

export type LatLng = { lat: number; lng: number };

export type LeafletSurfaceProps = {
  center: LatLng;
  zoom?: number;
  className?: string;
  children?: ReactNode;
};

/**
 * ظرفِ نقشه: `MapContainer` + لایه‌ی پس‌زمینه، به‌علاوه‌ی رفع باگ آیکن.
 *
 * **ارتفاع باید روی wrapper باشد، نه روی خودِ `MapContainer`.**
 * `globals.css` قاعده‌ی `.leaflet-container { height: 100% !important }` دارد
 * (دو بار، برای استایل پایه و «Enhanced»). `!important` هر کلاسِ
 * غیر-`!important` را می‌برد — پس `className="h-[420px]"` روی خودِ
 * `MapContainer` بی‌اثر می‌ماند و ارتفاع به `100%` والدِ با ارتفاعِ `auto`
 * تبدیل می‌شود، یعنی نقشه جمع می‌شود. این همان الگویی است که
 * `ReportLocationMapClient`، `NearbyAccidentsMapClient` و فرم‌های
 * قدیمیِ استان/شهر همگی رعایت می‌کنند: ارتفاع روی والد، `h-full` روی نقشه.
 *
 * `center` و `zoom` فقط **بارگذاری اولیه** را تعیین می‌کنند. برای جابه‌جایی
 * دوربین بعد از mount از `useMap()` داخل `children` استفاده کنید — دادنِ
 * `center` تازه به این کامپوننت آن را دنبال نمی‌کند.
 */
const LeafletSurface: React.FC<LeafletSurfaceProps> = ({
  center,
  zoom = 6,
  className = "h-[420px] w-full rounded-lg overflow-hidden border border-slate-700",
  children,
}) => {
  useEffect(() => {
    void ensureLeafletIcons();
  }, []);

  return (
    <div className={className}>
      <MapContainer
        center={[center.lat, center.lng]}
        className="h-full w-full"
        zoom={zoom}
      >
        <BasemapLayer />
        {children}
      </MapContainer>
    </div>
  );
};

export default LeafletSurface;
