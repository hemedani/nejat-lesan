"use client";

import { useEffect, useState } from "react";
import { getReporterDashboard } from "@/app/actions/accident/getReporterDashboard";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { ReporterDashboardResponse } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { DashboardHeader } from "@/components/patrol/DashboardHeader";
import { SummaryMetrics } from "@/components/patrol/SummaryMetrics";
import { ReportList, formatDate } from "@/components/patrol/ReportList";

export default function ReporterDashboardPage() {
  const { userLevel, userData } = useAuth(); const [data, setData] = useState<ReporterDashboardResponse | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = async () => { setLoading(true); setError(null); try { setData(unwrapApiResponse(await getReporterDashboard())); } catch (e) { setError(getPatrolErrorMessage(e)); } finally { setLoading(false); } };
  useEffect(() => { if (userLevel === "Patrol") void load(); else setLoading(false); }, [userLevel]);
  if (userLevel !== "Patrol") return <RoleNotice message={userLevel ? "این داشبورد فقط برای مأمور گشت است." : "برای مشاهده داشبورد وارد حساب کاربری شوید."} />;
  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-8 text-center text-rose-100"><p>{error}</p><button onClick={() => void load()} className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm">تلاش دوباره</button></div>;
  if (!data) return null;
  const returned = data.recentReports.filter((report) => report.review_status === "returned");
  return <div><DashboardHeader title="داشبورد من" description="وضعیت شیفت و گزارش‌های ثبت‌شده خود را دنبال کنید." onRefresh={() => void load()} loading={loading} /><div className="grid gap-4 md:grid-cols-3"><section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 md:col-span-2"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">مأمور گشت</p><h2 className="mt-1 text-lg font-semibold text-white">{[userData?.first_name, userData?.last_name].filter(Boolean).join(" ") || "کاربر"}</h2><p className="mt-1 text-sm text-slate-400">کد پرسنلی: {userData?.personnel_code || "ثبت نشده"}</p></div><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">شیفت جاری</span></div>{data.activeShift ? <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4"><Info label="نوع شیفت" value={data.activeShift.shift_type} /><Info label="شروع" value={formatDate(data.activeShift.start_at)} /><Info label="واحد گشت" value={data.activeShift.patrol_unit?.name || data.activeShift.patrol_unit?.code} /><Info label="خودرو" value={data.activeShift.vehicle?.plaque_no} /></div> : <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">اطلاعات شیفت فعال در دسترس نیست.</p>}</section><section className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5"><p className="text-xs text-blue-200">نیازمند اقدام</p><p className="mt-2 text-4xl font-bold text-white">{returned.length.toLocaleString("fa-IR")}</p><p className="mt-2 text-sm text-slate-300">گزارش برگشت‌خورده در فهرست اخیر</p></section></div><section className="mt-5 rounded-2xl border border-white/10 bg-slate-900/65 p-5"><h2 className="mb-5 font-semibold text-white">خلاصه وضعیت</h2><SummaryMetrics summary={data.summary} /></section><section className="mt-5 rounded-2xl border border-white/10 bg-slate-900/65 p-5"><h2 className="mb-5 font-semibold text-white">گزارش‌های اخیر</h2><ReportList reports={data.recentReports} /></section></div>;
}

function Info({ label, value }: { label: string; value?: string }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-slate-200">{value || "در دسترس نیست"}</p></div>; }
function DashboardSkeleton() { return <div className="animate-pulse space-y-5"><div className="h-20 rounded-2xl bg-white/5" /><div className="h-48 rounded-2xl bg-white/5" /><div className="h-64 rounded-2xl bg-white/5" /></div>; }
