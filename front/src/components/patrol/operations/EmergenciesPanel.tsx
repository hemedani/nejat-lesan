"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getEmergencies } from "@/app/actions/emergency/gets";
import { updateEmergencyStatus } from "@/app/actions/emergency/updateStatus";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { ToastNotify } from "@/utils/helper";
import { Button } from "@/components/atoms/Button";
import { EmptyState, Notice, PanelCard } from "@/components/patrol/ui";

type Emergency = {
  _id: string;
  status?: "active" | "acknowledged" | "resolved";
  connection_status?: "online" | "degraded" | "offline";
  note?: string;
  location?: { type: string; coordinates: [number, number] };
  gps_accuracy?: number;
  recorded_at?: string;
  resolved_at?: string;
  officer?: { _id: string; first_name?: string; last_name?: string; personnel_code?: string };
  patrol_unit?: { _id: string; name?: string; code?: string };
  vehicle?: { _id: string; title?: string; plaque_no?: string[] };
};

const emergencyProjection = {
  _id: 1,
  status: 1,
  connection_status: 1,
  note: 1,
  location: 1,
  gps_accuracy: 1,
  recorded_at: 1,
  resolved_at: 1,
  officer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
  patrol_unit: { _id: 1, name: 1, code: 1 },
  vehicle: { _id: 1, title: 1, plaque_no: 1 },
} as const;

const REFRESH_INTERVAL = 15_000;

const STATUS_FILTERS = [
  { key: "active", label: "فعال" },
  { key: "acknowledged", label: "در رسیدگی" },
  { key: "resolved", label: "حل‌شده" },
  { key: "all", label: "همه" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["key"];

const statusStyles: Record<string, string> = {
  active: "bg-rose-400/15 text-rose-200",
  acknowledged: "bg-amber-400/10 text-amber-200",
  resolved: "bg-emerald-400/10 text-emerald-200",
};

const statusLabels: Record<string, string> = {
  active: "فعال",
  acknowledged: "در رسیدگی",
  resolved: "حل‌شده",
};

const connectionLabels: Record<string, string> = {
  online: "آنلاین",
  degraded: "ضعیف",
  offline: "آفلاین",
};

const connectionStyles: Record<string, string> = {
  online: "bg-emerald-400/10 text-emerald-200",
  degraded: "bg-amber-400/10 text-amber-200",
  offline: "bg-rose-400/10 text-rose-200",
};

export function EmergenciesPanel({
  onActiveCountChange,
  onChanged,
}: {
  onActiveCountChange?: (count: number) => void;
  onChanged?: () => void;
}) {
  const [filter, setFilter] = useState<StatusFilter>("active");
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const response = await getEmergencies({
        set: { page: 1, limit: 100 },
        get: emergencyProjection as never,
      });
      const items = unwrapApiResponse<Emergency[]>(response) || [];
      if (!mountedRef.current) return;
      setEmergencies(items);
      setLoadError(null);
      onActiveCountChange?.(items.filter((item) => item.status === "active").length);
    } catch (cause) {
      if (!mountedRef.current) return;
      setLoadError(getPatrolErrorMessage(cause));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [onActiveCountChange]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    const interval = setInterval(() => void load(), REFRESH_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [load]);

  const changeStatus = async (item: Emergency, status: string, successMessage: string) => {
    setBusyId(item._id);
    try {
      unwrapApiResponse(
        await updateEmergencyStatus({ set: { _id: item._id, status }, get: { _id: 1, status: 1 } as never }),
      );
      ToastNotify("success", successMessage);
      await load();
      onChanged?.();
    } catch (cause) {
      ToastNotify("error", getPatrolErrorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  const visible = emergencies.filter((item) => filter === "all" || item.status === filter);

  return (
    <PanelCard
      title="درخواست‌های اضطراری"
      action={
        <span className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          به‌روزرسانی خودکار هر ۱۵ ثانیه
        </span>
      }
    >
      <nav className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              filter === item.key
                ? "bg-blue-600 font-semibold text-white"
                : "border border-white/10 bg-white/[.04] text-slate-400 hover:text-white"
            }`}
          >
            {item.label}
            <span className="mr-1 text-[11px] opacity-70">
              {item.key === "all"
                ? `(${emergencies.length.toLocaleString("fa-IR")})`
                : `(${emergencies.filter((emergency) => emergency.status === item.key).length.toLocaleString("fa-IR")})`}
            </span>
          </button>
        ))}
      </nav>

      {loadError && <Notice tone="rose">{loadError}</Notice>}
      {loading && !loadError && !emergencies.length && (
        <p className="text-sm text-slate-500">در حال دریافت…</p>
      )}
      {!loading && !visible.length && !loadError && <EmptyState message="موردی در این وضعیت وجود ندارد." />}

      <div className="grid gap-3 lg:grid-cols-2">
        {visible.map((item) => {
          const coords = item.location?.coordinates;
          return (
            <article
              key={item._id}
              className={`rounded-xl border p-4 ${
                item.status === "active" ? "border-rose-400/30 bg-rose-400/[.06]" : "border-white/5 bg-white/[.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    {[item.officer?.first_name, item.officer?.last_name].filter(Boolean).join(" ") || "نامشخص"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.officer?.personnel_code ? `کد ${item.officer.personnel_code} · ` : ""}
                    {item.patrol_unit?.name || "بدون واحد"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-1 text-[11px] ${statusStyles[item.status || "active"]}`}>
                    {statusLabels[item.status || "active"]}
                  </span>
                  {item.connection_status && (
                    <span className={`rounded-full px-2 py-1 text-[11px] ${connectionStyles[item.connection_status]}`}>
                      اتصال: {connectionLabels[item.connection_status]}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>زمان ثبت: {item.recorded_at ? new Date(item.recorded_at).toLocaleString("fa-IR") : "نامشخص"}</span>
                <span>دقت GPS: {item.gps_accuracy ? `${Math.round(item.gps_accuracy).toLocaleString("fa-IR")} متر` : "—"}</span>
                {coords && (
                  <a
                    href={`https://www.google.com/maps?q=${coords[1]},${coords[0]}`}
                    target="_blank"
                    rel="noreferrer"
                    className="col-span-2 text-blue-300 transition-colors hover:text-cyan-200"
                  >
                    مشاهده موقعیت روی نقشه ↗
                  </a>
                )}
              </div>

              {item.note && <p className="mt-2 rounded-lg bg-white/[.04] p-2 text-xs leading-5 text-slate-300">{item.note}</p>}

              {item.status !== "resolved" && (
                <div className="mt-3 flex gap-2">
                  {item.status === "active" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === item._id}
                      onClick={() => void changeStatus(item, "acknowledged", "درخواست در وضعیت رسیدگی قرار گرفت.")}
                    >
                      شروع رسیدگی
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="warning"
                    disabled={busyId === item._id}
                    onClick={() => void changeStatus(item, "resolved", "درخواست حل‌شده علامت خورد.")}
                  >
                    حل شد
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </PanelCard>
  );
}
