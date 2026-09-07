"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getAccidentProcesses } from "@/app/actions/accident_process/getAccidentProcesses";
import { activateAccidentProcess } from "@/app/actions/accident_process/activateProcess";
import { duplicateAccidentProcess } from "@/app/actions/accident_process/duplicateProcess";
import { removeAccidentProcess } from "@/app/actions/accident_process/removeProcess";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { AccidentProcessListItem } from "@/services/org-projections";
import { INCIDENT_TYPE_LABELS } from "@/utils/org";
import { Button } from "@/components/atoms/Button";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

type StatusFilter = "" | "draft" | "active" | "archived";

const STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس",
  active: "فعال",
  archived: "بایگانی",
};

const STATUS_TONES: Record<string, string> = {
  draft: "border-white/10 bg-white/[.04] text-slate-300",
  active: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  archived: "border-amber-400/25 bg-amber-400/10 text-amber-200",
};

export function ProcessListView({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [processes, setProcesses] = useState<AccidentProcessListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = unwrapApiResponse<{ data: AccidentProcessListItem[]; totalCount: number }>(
        await getAccidentProcesses({
          set: { organizationId: orgId, limit: 100, ...(statusFilter ? { status: statusFilter } : {}) },
        }),
      );
      setProcesses(Array.isArray(body?.data) ? body.data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<{ success: boolean; body?: unknown }>, id: string, ok: string) => {
    setBusyId(id);
    try {
      const response = await fn();
      if (response.success) {
        toast.success(ok);
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در انجام عملیات.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">فرایندهای ثبت رخداد</p>
          <h1 className="mt-1 text-2xl font-bold text-white">مدیریت فرایندها</h1>
          <p className="mt-2 text-sm text-slate-500">قالب پرسشنامه‌ای ثبت رخداد برای اپلیکیشن موبایل را بسازید، فعال و تکراری کنید.</p>
        </div>
        <Link href={`/org/${orgId}/processes/new`} className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-500">
          + فرایند جدید
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([["", "همه"], ["draft", "پیش‌نویس"], ["active", "فعال"], ["archived", "بایگانی"]] as Array<[StatusFilter, string]>).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              statusFilter === value ? "border-blue-400/40 bg-blue-400/10 text-blue-100" : "border-white/10 text-slate-400 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSkeleton blocks={[120, 120]} />
      ) : error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : processes.length === 0 ? (
        <EmptyState message="فرایندی یافت نشد." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {processes.map((process) => {
            const editable = process.status === "draft";
            return (
              <div key={process._id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{process.name}</p>
                    {process.description && <p className="mt-1 text-xs leading-5 text-slate-500">{process.description}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] ${STATUS_TONES[process.status] || STATUS_TONES.draft}`}>
                      {STATUS_LABELS[process.status] || process.status}
                    </span>
                    {process.incident_type && (
                      <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-[10px] text-blue-200">
                        {INCIDENT_TYPE_LABELS[process.incident_type] || process.incident_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">نسخه {process.version}</div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                  {editable ? (
                    <Button size="sm" variant="primary" onClick={() => router.push(`/org/${orgId}/processes/${process._id}`)}>ویرایش سازنده</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/org/${orgId}/processes/${process._id}`)}>مشاهده</Button>
                  )}
                  {editable && (
                    <Button
                      size="sm"
                      variant="warning"
                      loading={busyId === process._id}
                      disabled={busyId === process._id}
                      onClick={() => void run(() => activateAccidentProcess({ set: { _id: process._id } }), process._id, "فرایند فعال شد.")}
                    >
                      فعال‌سازی
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === process._id}
                    disabled={busyId === process._id}
                    onClick={() => void run(() => duplicateAccidentProcess({ set: { _id: process._id } }), process._id, "کپی ساخته شد.")}
                  >
                    تکراری‌سازی
                  </Button>
                  {editable && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busyId === process._id}
                      disabled={busyId === process._id}
                      onClick={() => {
                        if (window.confirm("فرایند پیش‌نویس حذف شود؟")) {
                          void run(() => removeAccidentProcess({ set: { _id: process._id } }), process._id, "فرایند حذف شد.");
                        }
                      }}
                    >
                      حذف
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
