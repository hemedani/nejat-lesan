"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/types/patrol";

const LeafletMap = dynamic(() => import("./ReportLocationMapClient"), { ssr: false });

/**
 * A `MapContainer` cannot be server-rendered, hence the `dynamic` import. Every prop
 * is optional and defaulted, so an existing caller keeps its current appearance and
 * behaviour without naming any of them.
 */
export function ReportLocationMap({
  location,
  gps,
  height,
  interactive,
  fitBoundsKey,
}: {
  location?: GeoPoint;
  gps?: GeoPoint;
  height?: string;
  interactive?: boolean;
  fitBoundsKey?: number;
}) {
  if (!location && !gps) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
        مختصات مکانی ثبت نشده است.
      </div>
    );
  }
  return (
    <LeafletMap
      location={location}
      gps={gps}
      height={height}
      interactive={interactive}
      fitBoundsKey={fitBoundsKey}
    />
  );
}
