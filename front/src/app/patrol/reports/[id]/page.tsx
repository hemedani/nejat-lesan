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

export default function ReporterReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userLevel } = useAuth();
  const [report, setReport] = useState<ReportDetailDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A patrol officer's own submissions are always accidents — the incident-report
  // form path is filed through the org's own forms, not a personal queue — so this
  // route reads `accident` and needs no `?source=`.
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
    if (userLevel === "Patrol") void load();
  }, [userLevel, load]);

  if (userLevel !== "Patrol") return <RoleNotice />;
  if (loading) return <PageSkeleton blocks={[72, 220, 320]} />;
  if (error || !report) {
    return <RetryErrorBox message={error || "گزارش یافت نشد."} onRetry={() => void load()} />;
  }

  return (
    <ReportDetail
      report={report}
      source="accident"
      onRefresh={load}
    />
  );
}
