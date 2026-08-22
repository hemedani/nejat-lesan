"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get } from "@/app/actions/accident/get";
import { getReportReviewHistory } from "@/app/actions/accident_review/getReportReviewHistory";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { reportDetailProjection, historyProjection } from "@/services/patrol-projections";
import type { PatrolReport, ReviewHistoryItem } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { ReportDetail } from "@/components/patrol/ReportDetail";

export default function ManagerReportDetailPage() {
  const { id } = useParams<{ id: string }>(); const { userLevel } = useAuth(); const allowed = userLevel === "Manager" || userLevel === "Ghost"; const [report, setReport] = useState<PatrolReport | null>(null); const [history, setHistory] = useState<ReviewHistoryItem[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { const [reportResponse, historyResponse] = await Promise.all([get(id, reportDetailProjection as never), getReportReviewHistory({ set: { reportId: id, page: 1, limit: 100 }, get: historyProjection as never })]); setReport(unwrapApiResponse<PatrolReport>(reportResponse)); setHistory(unwrapApiResponse<ReviewHistoryItem[]>(historyResponse) || []); } catch (e) { setError(getPatrolErrorMessage(e)); } finally { setLoading(false); } }, [id]);
  useEffect(() => { if (allowed) void load(); else setLoading(false); }, [allowed, load]);
  if (!allowed) return <RoleNotice message={userLevel ? "شما به این گزارش دسترسی ندارید." : "برای مشاهده گزارش وارد حساب کاربری شوید."} />; if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-white/5" />; if (error || !report) return <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-8 text-center text-rose-100">{error || "گزارش یافت نشد."}<button onClick={() => void load()} className="mt-4 block mx-auto rounded-lg border border-white/10 px-4 py-2 text-sm">تلاش دوباره</button></div>;
  return <ReportDetail report={report} history={history} manager onRefresh={load} />;
}
