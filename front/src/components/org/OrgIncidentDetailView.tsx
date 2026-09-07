"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { get } from "@/app/actions/accident/get";
import { getReportReviewHistory } from "@/app/actions/accident/getReportReviewHistory";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { reportDetailProjection, historyProjection } from "@/services/patrol-projections";
import type { PatrolReport, ReviewHistoryItem } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { ReportDetail } from "@/components/patrol/ReportDetail";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export function OrgIncidentDetailView({ orgId, reportId }: { orgId: string; reportId: string }) {
  const { userLevel, isOrgLeader } = useAuth();
  const allowed = userLevel === "Manager" || userLevel === "Ghost" || isOrgLeader;

  const [report, setReport] = useState<PatrolReport | null>(null);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportResponse, historyResponse] = await Promise.all([
        get(reportId, reportDetailProjection as never),
        getReportReviewHistory({
          set: { reportId, page: 1, limit: 100 },
          get: historyProjection as never,
        }),
      ]);
      setReport(unwrapApiResponse<PatrolReport>(reportResponse));
      setHistory(unwrapApiResponse<ReviewHistoryItem[]>(historyResponse) || []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (allowed) void load();
    else setLoading(false);
  }, [allowed, load]);

  if (!allowed) {
    return <RoleNotice message="شما به این رخداد دسترسی ندارید." />;
  }
  if (loading) return <PageSkeleton blocks={[96, 320]} />;
  if (error || !report) {
    return <RetryErrorBox message={error || "رخداد یافت نشد."} onRetry={() => void load()} />;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href={`/org/${orgId}/reports`} className="text-xs text-blue-300 hover:text-cyan-200">
          → بازگشت به گزارش‌های رخداد
        </Link>
      </div>
      <ReportDetail report={report} history={history} manager onRefresh={load} />
    </div>
  );
}
