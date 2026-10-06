"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchReportDetail } from "@/app/actions/incident_report/getReportDetail";
import { getPatrolErrorMessage } from "@/utils/api-response";
import type { ReportDetailDoc } from "@/types/report-detail";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/system/RoleNotice";
import { ReportDetail } from "@/components/patrol/ReportDetail";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export default function ManagerReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userLevel } = useAuth();
  const allowed = userLevel === "Manager" || userLevel === "Ghost";
  const [report, setReport] = useState<ReportDetailDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchReportDetail(String(id), "accident"));
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (allowed) void load();
    else setLoading(false);
  }, [allowed, load]);

  if (!allowed) {
    return (
      <RoleNotice
        message={userLevel ? "شما به این گزارش دسترسی ندارید." : "برای مشاهده گزارش وارد حساب کاربری شوید."}
      />
    );
  }
  if (loading) return <PageSkeleton blocks={[72, 220, 320]} />;
  if (error || !report) {
    return <RetryErrorBox message={error || "گزارش یافت نشد."} onRetry={() => void load()} />;
  }

  return <ReportDetail report={report} source="accident" manager onRefresh={load} />;
}
