"use client";

import { useEffect, useState } from "react";
import { getManagerDashboard } from "@/app/actions/accident/getManagerDashboard";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { ManagerDashboardResponse } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { DashboardHeader } from "@/components/patrol/DashboardHeader";
import { SummaryMetrics } from "@/components/patrol/SummaryMetrics";
import { ReportList } from "@/components/patrol/ReportList";

export default function ManagerDashboardPage() {
  const { userLevel } = useAuth(); const [data, setData] = useState<ManagerDashboardResponse | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const allowed = userLevel === "Manager" || userLevel === "Ghost";
  const load = async () => { setLoading(true); setError(null); try { setData(unwrapApiResponse(await getManagerDashboard())); } catch (e) { setError(getPatrolErrorMessage(e)); } finally { setLoading(false); } };
  useEffect(() => { if (allowed) void load(); else setLoading(false); }, [allowed]);
  if (!allowed) return <RoleNotice message={userLevel ? "شما به داشبورد مدیر دسترسی ندارید." : "برای مشاهده داشبورد وارد حساب کاربری شوید."} />;
  if (loading) return <div className="animate-pulse space-y-5"><div className="h-20 rounded-2xl bg-white/5" /><div className="h-64 rounded-2xl bg-white/5" /></div>;
  if (error) return <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-8 text-center text-rose-100">{error}<button onClick={() => void load()} className="mt-4 block mx-auto rounded-lg border border-white/10 px-4 py-2 text-sm">تلاش دوباره</button></div>;
  if (!data) return null;
  return <div><DashboardHeader title="مرکز بررسی گزارش‌ها" description="صف گزارش‌های مأموران گشت و وضعیت بررسی مدیریتی." onRefresh={() => void load()} loading={loading} /><section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5"><SummaryMetrics summary={data.summary} /></section><section className="mt-5 rounded-2xl border border-white/10 bg-slate-900/65 p-5"><h2 className="mb-5 font-semibold text-white">گزارش‌های اخیر</h2><ReportList reports={data.recentReports} manager /></section></div>;
}
