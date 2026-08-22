"use client";

import { useEffect, useState } from "react";
import { getReporterDashboard } from "@/app/actions/accident/getReporterDashboard";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { PatrolReport } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { DashboardHeader } from "@/components/patrol/DashboardHeader";
import { ReportList } from "@/components/patrol/ReportList";

export default function ReporterReportsPage() {
  const { userLevel } = useAuth(); const [reports, setReports] = useState<PatrolReport[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const allowed = userLevel === "Patrol";
  const load = async () => { setLoading(true); setError(null); try { const body = unwrapApiResponse<{ recentReports: PatrolReport[] }>(await getReporterDashboard({ set: { page: 1, limit: 50 } })); setReports(body.recentReports || []); } catch (e) { setError(getPatrolErrorMessage(e)); } finally { setLoading(false); } };
  useEffect(() => { if (allowed) void load(); else setLoading(false); }, [allowed]);
  if (!allowed) return <RoleNotice message={userLevel ? "این فهرست فقط برای مأمور گشت است." : "برای مشاهده گزارش‌ها وارد حساب کاربری شوید."} />;
  return <div><DashboardHeader title="گزارش‌های من" description="گزارش‌های ثبت‌شده شما با وضعیت همگام‌سازی و بررسی." onRefresh={() => void load()} loading={loading} />{error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-8 text-center text-rose-100">{error}<button onClick={() => void load()} className="mt-4 block mx-auto rounded-lg border border-white/10 px-4 py-2 text-sm">تلاش دوباره</button></div> : loading ? <div className="h-80 animate-pulse rounded-2xl bg-white/5" /> : <ReportList reports={reports} />}</div>;
}
