"use client";

import { useEffect, useState } from "react";
import { getReporterDashboard } from "@/app/actions/accident/getReporterDashboard";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { PatrolReport } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { DashboardHeader } from "@/components/patrol/DashboardHeader";
import { ReportList } from "@/components/patrol/ReportList";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export default function ReporterReportsPage() {
  const { userLevel } = useAuth();
  const allowed = userLevel === "Patrol";
  const [reports, setReports] = useState<PatrolReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = unwrapApiResponse<{ recentReports: PatrolReport[] }>(
        await getReporterDashboard({ set: { page: 1, limit: 50 } }),
      );
      setReports(body.recentReports || []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) void load();
    else setLoading(false);
  }, [allowed]);

  if (!allowed) {
    return (
      <RoleNotice
        message={userLevel ? "این فهرست فقط برای مأمور گشت است." : "برای مشاهده گزارش‌ها وارد حساب کاربری شوید."}
      />
    );
  }

  return (
    <div>
      <DashboardHeader
        title="گزارش‌های من"
        description="گزارش‌های ثبت‌شده شما با وضعیت همگام‌سازی و بررسی."
        onRefresh={() => void load()}
        loading={loading}
      />
      {error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : loading ? (
        <PageSkeleton blocks={[320]} />
      ) : (
        <ReportList reports={reports} />
      )}
    </div>
  );
}
