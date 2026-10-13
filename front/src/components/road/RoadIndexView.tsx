"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminRecordRoutes } from "@/utils/admin-record-routes";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { gets } from "@/app/actions/road/gets";
import { count } from "@/app/actions/road/count";
import { remove } from "@/app/actions/road/remove";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import {
  roadListProjection,
  type RoadListItem,
} from "@/services/road-projections";
import { Button } from "@/components/atoms/Button";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

const PAGE_SIZE = 20;

export function RoadIndexView() {
  const router = useRouter();
  const [rows, setRows] = useState<RoadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, counted] = await Promise.all([
        gets({
          set: { page, limit: PAGE_SIZE, name: query.trim() || undefined },
          get: { ...roadListProjection },
        }),
        count({ set: query.trim() ? { name: query.trim() } : {}, get: { qty: 1 } }),
      ]);
      setRows(unwrapApiResponse<RoadListItem[]>(data) ?? []);
      setTotal(unwrapApiResponse<{ qty: number }>(counted)?.qty ?? 0);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  async function handleRemove(road: RoadListItem) {
    if (!window.confirm(`حذف جاده «${road.name}»؟ این عمل قابل بازگشت نیست.`)) return;
    const response = await remove(road._id, false);
    if (response.success) {
      toast.success("جاده حذف شد.");
      await load();
    } else {
      const message = (response.body as { message?: string } | undefined)?.message || "";
      toast.error(getPatrolErrorMessage(new Error(message)));
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">مدیریت جاده‌ها</p>
          <h1 className="mt-1 text-2xl font-bold text-white">جاده‌ها</h1>
          <p className="mt-2 text-sm text-slate-500">
            محور هر جاده را روی نقشه رسم کنید؛ طول آن در سرور از روی همان هندسه
            محاسبه و ذخیره می‌شود.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-slate-400">
            {total.toLocaleString("fa-IR")} جاده
          </span>
          <Button onClick={() => router.push(adminRecordRoutes.roadNew())}>
            + افزودن جاده
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:flex-row sm:items-center">
        <input
          className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="جست‌وجوی نام جاده…"
          value={query}
        />
        <Button onClick={() => void load()} size="sm" variant="neutral">
          تازه‌سازی
        </Button>
      </div>

      {error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : loading ? (
        <PageSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState message="جاده‌ای یافت نشد." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((road) => (
            <div
              className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl"
              key={road._id}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  className="text-right text-sm font-semibold text-white hover:text-blue-300"
                  onClick={() => router.push(adminRecordRoutes.road(road._id))}
                  type="button"
                >
                  {road.name}
                </button>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[.04] px-2 py-0.5 text-[11px] text-slate-400">
                  {road.province?.name ?? "بدون استان"}
                </span>
              </div>

              {(road.origin || road.destination) && (
                <p className="mt-2 text-xs text-slate-400">
                  {road.origin || "؟"} ← {road.destination || "؟"}
                </p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                طول:{" "}
                {road.total_length_meters
                  ? `${Math.round(road.total_length_meters).toLocaleString("fa-IR")} متر`
                  : "ثبت نشده"}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={() => router.push(adminRecordRoutes.road(road._id))}
                  size="sm"
                  variant="secondary"
                >
                  ویرایش
                </Button>
                <Button
                  onClick={() => void handleRemove(road)}
                  size="sm"
                  variant="danger"
                >
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            size="sm"
            variant="neutral"
          >
            قبلی
          </Button>
          <span className="text-xs text-slate-400">
            صفحهٔ {page.toLocaleString("fa-IR")} از{" "}
            {pageCount.toLocaleString("fa-IR")}
          </span>
          <Button
            disabled={page >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            size="sm"
            variant="neutral"
          >
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}

export default RoadIndexView;
