"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { get } from "@/app/actions/accident/get";
import { getReportReviewHistory } from "@/app/actions/accident/getReportReviewHistory";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { reportDetailProjection, historyProjection } from "@/services/patrol-projections";
import type { PatrolReport, ReviewHistoryItem } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { ScopedView } from "@/components/system/ScopedView";
import { ReportDetail } from "@/components/patrol/ReportDetail";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export default function EmployeeReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = String(params?.reportId);
  const { userLevel } = useAuth();
  const allowed = userLevel === "Patrol";

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

  return (
    <ScopedView require="unit">
      {() => {
        if (!allowed) {
          return (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-8 text-center text-sm leading-6 text-amber-100">
              این بخش فقط برای کاربران با نقش «مأمور گشت» در دسترس است.
            </div>
          );
        }
        if (loading) return <PageSkeleton blocks={[96, 320]} />;
        if (error || !report) {
          return (
            <RetryErrorBox message={error || "گزارش یافت نشد."} onRetry={() => void load()} />
          );
        }
        return (
          <div>
            <div className="mb-4">
              <Link
                href="/employee/reports"
                className="text-xs text-blue-300 hover:text-cyan-200"
              >
                → بازگشت به رخدادهای من
              </Link>
            </div>
            <ReportDetail
              report={report}
              history={history}
              manager={false}
              onRefresh={load}
            />
          </div>
        );
      }}
    </ScopedView>
  );
}
