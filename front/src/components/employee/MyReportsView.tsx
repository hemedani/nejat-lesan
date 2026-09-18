"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getReporterDashboard } from "@/app/actions/accident/getReporterDashboard";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { PatrolReport } from "@/types/patrol";
import { ReportList } from "@/components/patrol/ReportList";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";

/**
 * The employee's own incident reports.
 *
 * `getReporterDashboard` is level-gated to Patrol on the backend, so the guard
 * here is a real requirement rather than a cosmetic one.
 */
export function MyReportsView() {
  const { userLevel } = useAuth();
  const allowed = userLevel === "Patrol";

  const [reports, setReports] = useState<PatrolReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = unwrapApiResponse<{ recentReports?: PatrolReport[] }>(
        await getReporterDashboard({ set: { page: 1, limit: 50 } }),
      );
      setReports(body.recentReports || []);
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

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-8 text-center text-sm leading-6 text-amber-100">
        این بخش فقط برای کاربران با نقش «مأمور گشت» در دسترس است.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">گشت و رخدادها</p>
          <h1 className="mt-1 text-2xl font-bold text-white">رخدادهای من</h1>
          <p className="mt-2 text-sm text-slate-500">
            رخدادهای ثبت‌شده شما با وضعیت همگام‌سازی و بررسی.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={loading} loading={loading}>
          {loading ? "در حال تازه‌سازی..." : "تازه‌سازی"}
        </Button>
      </div>

      {error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : loading ? (
        <PageSkeleton blocks={[320]} />
      ) : reports.length === 0 ? (
        <EmptyState message="رخدادی برای شما ثبت نشده است." />
      ) : (
        <ReportList reports={reports} detailBase="/employee" />
      )}
    </div>
  );
}
