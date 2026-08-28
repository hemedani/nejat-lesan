"use client";

import { useCallback, useEffect, useState } from "react";
import { getManagerReports } from "@/app/actions/accident/getManagerReports";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { PatrolReport, ReviewStatus, SyncStatus } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { DashboardHeader } from "@/components/patrol/DashboardHeader";
import { ReportList } from "@/components/patrol/ReportList";
import { PageSkeleton, PanelCard, RetryErrorBox } from "@/components/patrol/ui";
import SelectBox from "@/components/atoms/Select";

const reviewStatusOptions: Array<{ value: ReviewStatus; label: string }> = [
  { value: "submitted", label: "ارسال‌شده" },
  { value: "under_review", label: "در حال بررسی" },
  { value: "returned", label: "برگشت برای اصلاح" },
  { value: "approved", label: "تأییدشده" },
  { value: "completed", label: "تکمیل‌شده" },
];

const syncStatusOptions: Array<{ value: SyncStatus; label: string }> = [
  { value: "synced", label: "همگام‌سازی‌شده" },
  { value: "rejected", label: "ردشده" },
  { value: "queued", label: "در صف" },
  { value: "syncing", label: "در حال همگام‌سازی" },
];

export default function ManagerReportsPage() {
  const { userLevel } = useAuth();
  const allowed = userLevel === "Manager" || userLevel === "Ghost";
  const [reports, setReports] = useState<PatrolReport[]>([]);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | "">("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = unwrapApiResponse<PatrolReport[]>(
        await getManagerReports({
          set: {
            page: 1,
            limit: 50,
            ...(reviewStatus ? { reviewStatus } : {}),
            ...(syncStatus ? { syncStatus } : {}),
          },
          get: {},
        }),
      );
      setReports(body || []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [reviewStatus, syncStatus]);

  useEffect(() => {
    if (allowed) void load();
    else setLoading(false);
  }, [allowed, load]);

  if (!allowed) {
    return (
      <RoleNotice
        message={
          userLevel
            ? "شما به فهرست مدیریتی دسترسی ندارید."
            : "برای مشاهده گزارش‌ها وارد حساب کاربری شوید."
        }
      />
    );
  }

  return (
    <div>
      <DashboardHeader
        title="صف بررسی گزارش‌ها"
        description="فقط فیلترهای پشتیبانی‌شده توسط سرویس نمایش داده می‌شوند."
        onRefresh={() => void load()}
        loading={loading}
      />

      <PanelCard className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SelectBox
            name="filter-review-status"
            placeholder="همه وضعیت‌های بررسی"
            value={reviewStatus}
            onValueChange={(value) => setReviewStatus(value as ReviewStatus | "")}
            options={reviewStatusOptions}
            className="sm:w-64"
          />
          <SelectBox
            name="filter-sync-status"
            placeholder="همه وضعیت‌های همگام‌سازی"
            value={syncStatus}
            onValueChange={(value) => setSyncStatus(value as SyncStatus | "")}
            options={syncStatusOptions}
            className="sm:w-64"
          />
        </div>
      </PanelCard>

      {error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : loading ? (
        <PageSkeleton blocks={[320]} />
      ) : (
        <ReportList reports={reports} manager />
      )}
    </div>
  );
}
