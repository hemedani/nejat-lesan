"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { get } from "@/app/actions/accident/get";
import { getReportReviewHistory } from "@/app/actions/accident/getReportReviewHistory";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { reportDetailProjection, historyProjection } from "@/services/patrol-projections";
import type { PatrolReport, ReviewHistoryItem } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/system/RoleNotice";
import { ReportDetail } from "@/components/patrol/ReportDetail";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export function OrgIncidentDetailView({
  reportId,
  backHref,
}: {
  reportId: string;
  /**
   * Where the "back to reports" link points — `orgRoutes.reports()` or
   * `unitHeadRoutes.reports()`.
   *
   * Required, and deliberately not defaulted. It used to fall back to
   * `/org/${orgId}/reports`, so the back button on the org-head report detail
   * page navigated *out* of its own panel. `orgId` went with it: the fallback was
   * its only use.
   */
  backHref: string;
}) {
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
      const reportResponse = await get(reportId, reportDetailProjection as never);
      setReport(unwrapApiResponse<PatrolReport>(reportResponse));

      // Fetched separately, and never allowed to fail the page.
      //
      // `accident.getReportReviewHistory` resolves its scope through
      // `getReportScope`, which handles only Patrol and Manager/Ghost and
      // **throws** for OrgHead/UnitHead (`back/src/accident/reportScope.ts`).
      // The org-head oversight console is built for exactly those roles, so in a
      // `Promise.all` its rejection turned a page the org head reached by
      // legitimate navigation into an error box.
      //
      // The report itself is readable by them — `accident.get` carries no
      // `grantAccess`. So a refused history yields an empty trail, and the
      // backend fix in `back/prompt/02-fix-review-history-scope-for-org-leaders.md`
      // improves this surface with no further frontend change.
      try {
        const historyResponse = await getReportReviewHistory({
          set: { reportId, page: 1, limit: 100 },
          get: historyProjection as never,
        });
        setHistory(unwrapApiResponse<ReviewHistoryItem[]>(historyResponse) || []);
      } catch {
        setHistory([]);
      }
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
        <Link
          href={backHref}
          className="text-xs text-blue-300 hover:text-cyan-200"
        >
          → بازگشت به گزارش‌های رخداد
        </Link>
      </div>
      <ReportDetail report={report} history={history} manager onRefresh={load} />
    </div>
  );
}
