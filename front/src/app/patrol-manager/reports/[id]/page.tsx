"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get } from "@/app/actions/accident/get";
import { getReportReviewHistory } from "@/app/actions/accident/getReportReviewHistory";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { reportDetailProjection, historyProjection } from "@/services/patrol-projections";
import type { PatrolReport, ReviewHistoryItem } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { ReportDetail } from "@/components/patrol/ReportDetail";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export default function ManagerReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userLevel } = useAuth();
  const allowed = userLevel === "Manager" || userLevel === "Ghost";
  const [report, setReport] = useState<PatrolReport | null>(null);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportResponse, historyResponse] = await Promise.all([
        get(id, reportDetailProjection as never),
        getReportReviewHistory({
          set: { reportId: id, page: 1, limit: 100 },
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
  if (loading) return <PageSkeleton blocks={[96, 320]} />;
  if (error || !report) {
    return <RetryErrorBox message={error || "گزارش یافت نشد."} onRetry={() => void load()} />;
  }

  return <ReportDetail report={report} history={history} manager onRefresh={load} />;
}
