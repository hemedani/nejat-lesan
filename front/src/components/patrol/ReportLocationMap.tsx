"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/types/patrol";

const LeafletMap = dynamic(() => import("./ReportLocationMapClient"), { ssr: false });

export function ReportLocationMap({ location, gps }: { location?: GeoPoint; gps?: GeoPoint }) {
  if (!location && !gps) return <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">مختصات مکانی ثبت نشده است.</div>;
  return <LeafletMap location={location} gps={gps} />;
}
