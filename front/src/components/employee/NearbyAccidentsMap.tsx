"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { nearbyAccidents } from "@/app/actions/accident/nearbyAccidents";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { Button } from "@/components/atoms/Button";
import { Notice, PanelCard } from "@/components/patrol/ui";
import type { MapApi, MapBounds, NearbyAccidentPoint } from "./nearby-accidents-types";

const LeafletMap = dynamic(() => import("./NearbyAccidentsMapClient"), { ssr: false });

/** Tehran — the same fallback centre the spatial chart maps use. */
const DEFAULT_CENTER: [number, number] = [35.6892, 51.389];
const DEFAULT_SPAN = 0.35;
const MAX_MARKERS = 300;

function boxAround(lat: number, lng: number, span = DEFAULT_SPAN): MapBounds {
  return {
    minLat: lat - span,
    maxLat: lat + span,
    minLng: lng - span,
    maxLng: lng + span,
  };
}

/**
 * Map of synced accidents near the officer, for the employee/patrol panel.
 *
 * Access is enforced by the backend (`accident.nearbyAccidents` accepts Patrol
 * with `can_view_map`, plus Manager/Ghost), so instead of duplicating that rule
 * here we surface the rejection message. Only synced accidents inside the
 * current viewport are returned, and the payload carries no driver data.
 */
export function NearbyAccidentsMap() {
  const [accidents, setAccidents] = useState<NearbyAccidentPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiRef = useRef<MapApi | null>(null);
  const boundsRef = useRef<MapBounds>(boxAround(DEFAULT_CENTER[0], DEFAULT_CENTER[1]));

  const load = useCallback(async (bounds: MapBounds) => {
    setLoading(true);
    setError(null);
    try {
      const response = await nearbyAccidents({
        set: { ...bounds, limit: MAX_MARKERS },
        get: { accidents: 1 },
      });
      const body = unwrapApiResponse<{ accidents?: NearbyAccidentPoint[] }>(response);
      setAccidents(Array.isArray(body?.accidents) ? body.accidents : []);
    } catch (err) {
      setError(getPatrolErrorMessage(err));
      setAccidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(boundsRef.current);
  }, [load]);

  const handleBounds = useCallback((bounds: MapBounds) => {
    boundsRef.current = bounds;
  }, []);

  const searchArea = useCallback(() => {
    void load(boundsRef.current);
  }, [load]);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("مرورگر از موقعیت مکانی پشتیبانی نمی‌کند.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        apiRef.current?.flyTo(latitude, longitude, 14);
        void load(boxAround(latitude, longitude));
      },
      () => setError("دسترسی به موقعیت مکانی ممکن نشد."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [load]);

  const located = accidents.filter((item) => Boolean(item.location)).length;

  return (
    <PanelCard
      title="حوادث نزدیک روی نقشه"
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={locate}>
            موقعیت من
          </Button>
          <Button variant="primary" size="sm" loading={loading} onClick={searchArea}>
            جست‌وجوی این محدوده
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs leading-6 text-slate-500">
          فقط حوادث همگام‌سازی‌شده در محدوده‌ی نمایش‌داده‌شده نشان داده می‌شوند. پس از جابه‌جا کردن
          نقشه، «جست‌وجوی این محدوده» را بزنید تا فهرست تازه شود.
        </p>

        {error && <Notice tone="rose">{error}</Notice>}

        <div className="relative h-[30rem] overflow-hidden rounded-xl border border-white/10 bg-slate-900">
          <LeafletMap
            accidents={accidents}
            center={DEFAULT_CENTER}
            apiRef={apiRef}
            onBounds={handleBounds}
          />

          {!loading && !error && located === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
              <div className="rounded-xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-slate-300">
                حادثه‌ای در این محدوده یافت نشد.
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          {loading
            ? "در حال دریافت..."
            : `${located.toLocaleString("fa-IR")} حادثه روی نقشه`}
        </p>
      </div>
    </PanelCard>
  );
}
