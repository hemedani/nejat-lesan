"use client";

import { useCallback, useEffect, useState } from "react";
import { getManagerDashboard } from "@/app/actions/accident/getManagerDashboard";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { ManagerDashboardResponse } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { DashboardHeader } from "@/components/patrol/DashboardHeader";
import { SummaryMetrics } from "@/components/patrol/SummaryMetrics";
import { ReportList } from "@/components/patrol/ReportList";
import { PageSkeleton, PanelCard, RetryErrorBox } from "@/components/patrol/ui";
import { SyncStatusWidget } from "@/components/patrol/operations/SyncStatusWidget";

export default function ManagerDashboardPage() {
  const { userLevel } = useAuth();
  const allowed = userLevel === "Manager" || userLevel === "Ghost";
  const [data, setData] = useState<ManagerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(unwrapApiResponse<ManagerDashboardResponse>(await getManagerDashboard()));
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
      <RoleNotice
        message={
          userLevel
            ? "شما به داشبورد مدیر دسترسی ندارید."
            : "برای مشاهده داشبورد وارد حساب کاربری شوید."
        }
      />
    );
  }
  if (loading) return <PageSkeleton />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!data) return null;

  return (
    <div>
      <DashboardHeader
        title="مرکز بررسی گزارش‌ها"
        description="صف گزارش‌های مأموران گشت و وضعیت بررسی مدیریتی."
        onRefresh={() => void load()}
        loading={loading}
      />

      <PanelCard>
        <SummaryMetrics summary={data.summary} />
      </PanelCard>

      <PanelCard title="وضعیت همگام‌سازی گزارش‌ها" className="mt-5">
        <p className="mb-3 text-xs text-slate-500">
          توزیع گزارش‌های ثبت‌شده توسط اپلیکیشن موبایل بر اساس وضعیت همگام‌سازی.
        </p>
        <SyncStatusWidget />
      </PanelCard>

      <PanelCard title="گزارش‌های اخیر" className="mt-5">
        <ReportList reports={data.recentReports} manager />
      </PanelCard>
    </div>
  );
}
