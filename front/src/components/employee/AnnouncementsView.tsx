"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { getAnnouncementRows } from "@/app/actions/announcement/gets";
import { markAnnouncementRead } from "@/app/actions/announcement/markRead";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";

interface Announcement {
  _id: string;
  title?: string;
  body?: string;
  priority?: string;
  expires_at?: string;
  createdAt?: string;
  registrer?: { first_name?: string; last_name?: string };
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "عادی",
  normal: "معمولی",
  high: "مهم",
  urgent: "فوری",
};

const PRIORITY_TONES: Record<string, string> = {
  low: "border-white/10 bg-white/[.04] text-slate-300",
  normal: "border-blue-400/25 bg-blue-400/10 text-blue-200",
  high: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  urgent: "border-rose-400/25 bg-rose-400/10 text-rose-200",
};

/**
 * Announcements for the employee/officer.
 *
 * `announcement.gets` is gated to Patrol/Manager on the backend, so the guard
 * below mirrors the nav gate in `panel-nav.ts`.
 */
export function AnnouncementsView() {
  const { userLevel } = useAuth();
  const allowed = userLevel === "Patrol";

  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<Announcement[]>(
        await getAnnouncementRows({
          get: {
            _id: 1,
            title: 1,
            body: 1,
            priority: 1,
            expires_at: 1,
            createdAt: 1,
            registrer: { _id: 1, first_name: 1, last_name: 1 },
          },
        }),
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) void load();
    else setLoading(false);
  }, [allowed, load]);

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      const response = await markAnnouncementRead({ set: { announcementId: id } });
      if (response.success) {
        toast.success("اطلاعیه خوانده‌شده علامت خورد.");
      } else {
        toast.error(
          (response.body as { message?: string } | undefined)?.message ||
            "خطا در ثبت وضعیت خوانده‌شده.",
        );
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-8 text-center text-sm leading-6 text-amber-100">
        این بخش فقط برای کاربران با نقش «مأمور گشت» در دسترس است.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-blue-300">گشت و رخدادها</p>
        <h1 className="mt-1 text-2xl font-bold text-white">اطلاعیه‌ها</h1>
        <p className="mt-2 text-sm text-slate-500">
          اطلاعیه‌های سازمان و ستاد برای مأموران گشت.
        </p>
      </div>

      {error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : loading ? (
        <PageSkeleton blocks={[140, 140, 140]} />
      ) : rows.length === 0 ? (
        <EmptyState message="اطلاعیه‌ای منتشر نشده است." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const priority = row.priority || "normal";
            return (
              <article
                key={row._id}
                className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-white">{row.title || "بدون عنوان"}</h2>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                          PRIORITY_TONES[priority] || PRIORITY_TONES.normal
                        }`}
                      >
                        {PRIORITY_LABELS[priority] || priority}
                      </span>
                    </div>
                    {row.body && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                        {row.body}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {row.registrer && (
                        <span>
                          {`${row.registrer.first_name || ""} ${row.registrer.last_name || ""}`.trim()}
                        </span>
                      )}
                      {row.createdAt && (
                        <span>{new Date(row.createdAt).toLocaleDateString("fa-IR")}</span>
                      )}
                      {row.expires_at && (
                        <span>
                          انقضا: {new Date(row.expires_at).toLocaleDateString("fa-IR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === row._id}
                    disabled={busyId === row._id}
                    onClick={() => void markRead(row._id)}
                  >
                    خوانده شد
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
