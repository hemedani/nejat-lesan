"use client";

import { useCallback, useEffect, useState } from "react";
import { getManagerReports } from "@/app/actions/accident/getManagerReports";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { PatrolReport, ReviewStatus, SyncStatus } from "@/types/patrol";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { DashboardHeader } from "@/components/patrol/DashboardHeader";
import { ReportList } from "@/components/patrol/ReportList";

export default function ManagerReportsPage() {
  const { userLevel } = useAuth(); const allowed = userLevel === "Manager" || userLevel === "Ghost"; const [reports, setReports] = useState<PatrolReport[]>([]); const [reviewStatus, setReviewStatus] = useState<ReviewStatus | "">(""); const [syncStatus, setSyncStatus] = useState<SyncStatus | "">(""); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { const body = unwrapApiResponse<PatrolReport[]>(await getManagerReports({ set: { page: 1, limit: 50, ...(reviewStatus ? { reviewStatus } : {}), ...(syncStatus ? { syncStatus } : {}) }, get: {} })); setReports(body || []); } catch (e) { setError(getPatrolErrorMessage(e)); } finally { setLoading(false); } }, [reviewStatus, syncStatus]);
  useEffect(() => { if (allowed) void load(); else setLoading(false); }, [allowed, load]);
  if (!allowed) return <RoleNotice message={userLevel ? "شما به فهرست مدیریتی دسترسی ندارید." : "برای مشاهده گزارش‌ها وارد حساب کاربری شوید."} />;
  return <div><DashboardHeader title="صف بررسی گزارش‌ها" description="فقط فیلترهای پشتیبانی‌شده توسط سرویس نمایش داده می‌شوند." onRefresh={() => void load()} loading={loading} /><section className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/65 p-4 sm:flex-row"><select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as ReviewStatus | "")} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"><option value="">همه وضعیت‌های بررسی</option><option value="submitted">ارسال‌شده</option><option value="under_review">در حال بررسی</option><option value="returned">برگشت برای اصلاح</option><option value="approved">تأییدشده</option><option value="completed">تکمیل‌شده</option></select><select value={syncStatus} onChange={(e) => setSyncStatus(e.target.value as SyncStatus | "")} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"><option value="">همه وضعیت‌های همگام‌سازی</option><option value="synced">همگام‌سازی‌شده</option><option value="rejected">ردشده</option><option value="queued">در صف</option><option value="syncing">در حال همگام‌سازی</option></select></section>{error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-8 text-center text-rose-100">{error}<button onClick={() => void load()} className="mt-4 block mx-auto rounded-lg border border-white/10 px-4 py-2 text-sm">تلاش دوباره</button></div> : loading ? <div className="h-80 animate-pulse rounded-2xl bg-white/5" /> : <ReportList reports={reports} manager />}</div>;
}
