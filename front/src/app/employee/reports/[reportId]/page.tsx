"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchReportDetail } from "@/app/actions/incident_report/getReportDetail";
import { getPatrolErrorMessage } from "@/utils/api-response";
import type { ReportDetailDoc } from "@/types/report-detail";
import { useAuth } from "@/context/AuthContext";
import { ScopedView } from "@/components/system/ScopedView";
import { employeeRoutes } from "@/utils/employee-routes";
import { ReportDetail } from "@/components/patrol/ReportDetail";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export default function EmployeeReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const { userLevel } = useAuth();
  const allowed = userLevel === "Patrol";
  const [report, setReport] = useState<ReportDetailDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchReportDetail(String(params?.reportId), "accident"));
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [params]);

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
        if (loading) return <PageSkeleton blocks={[72, 220, 320]} />;
        if (error || !report) {
          return (
            <RetryErrorBox message={error || "گزارش یافت نشد."} onRetry={() => void load()} />
          );
        }
        return (
          <div>
            <div className="mb-3">
              <Link
                href={employeeRoutes.reports()}
                className="text-xs text-blue-300 hover:text-cyan-200"
              >
                → بازگشت به رخدادهای من
              </Link>
            </div>
            <ReportDetail report={report} source="accident" onRefresh={load} />
          </div>
        );
      }}
    </ScopedView>
  );
}