"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchReportDetail } from "@/app/actions/incident_report/getReportDetail";
import { getPatrolErrorMessage } from "@/utils/api-response";
import type { ReportDetailDoc, ReportSource } from "@/types/report-detail";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/system/RoleNotice";
import { ReportDetail } from "@/components/patrol/ReportDetail";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

/**
 * The report detail page, as hosted by the org-head and unit-head consoles.
 *
 * ## Which collection
 *
 * `?source=` says whether the id belongs to `accident` or `incident_report`, and
 * it is read here rather than inferred. This component used to call `accident.get`
 * unconditionally, so every non-accident row in the console — which merges both
 * collections into one table — missed and rendered an error box. `fetchReportDetail`
 * is the single place that branches now.
 *
 * ## Why there is no second request
 *
 * `review_history` is an embedded array on both models, so the trail arrives inside
 * the report fetch. The separate `accident.getReportReviewHistory` call existed
 * only because `accident.get` used to carry no scope at all: it always succeeded,
 * so the history was the one thing that could be refused, and
 * `getPatrolErrorMessage` needed a recovery branch to keep that refusal off the
 * page. `accident.get` now resolves its scope through `getOrgReportBase`, so a
 * report this viewer may not see fails *here* — the correct answer — and there is
 * no second call whose failure could be degraded away.
 */
export function OrgIncidentDetailView({
  reportId,
  source,
  backHref,
  organizationId,
}: {
  reportId: string;
  /**
   * Which collection the id belongs to, read from `?source=` by the route.
   *
   * Required rather than defaulted to `accident`. A default here would silently
   * send every non-accident id to the wrong collection — which is the bug this
   * component is being fixed for.
   */
  source: ReportSource;
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
  /** Scopes the form-definition read that labels a non-accident report's answers. */
  organizationId?: string;
}) {
  const { userLevel, isOrgLeader } = useAuth();
  const allowed = userLevel === "Manager" || userLevel === "Ghost" || isOrgLeader;

  const [report, setReport] = useState<ReportDetailDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchReportDetail(reportId, source));
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [reportId, source]);

  useEffect(() => {
    if (allowed) void load();
    else setLoading(false);
  }, [allowed, load]);

  if (!allowed) {
    return <RoleNotice message="شما به این رخداد دسترسی ندارید." />;
  }
  if (loading) return <PageSkeleton blocks={[72, 220, 320]} />;
  if (error || !report) {
    return (
      <RetryErrorBox message={error || "رخداد یافت نشد."} onRetry={() => void load()} />
    );
  }

  return (
    <div>
      <div className="mb-3">
        <Link href={backHref} className="text-xs text-blue-300 hover:text-cyan-200">
          → بازگشت به گزارش‌های رخداد
        </Link>
      </div>
      <ReportDetail
        report={report}
        source={source}
        organizationId={organizationId}
        manager
        onRefresh={load}
      />
    </div>
  );
}