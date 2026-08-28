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
import { InfoRow, Notice, PageSkeleton, PanelCard, RetryErrorBox } from "@/components/patrol/ui";

export default function ReporterDashboardPage() {
  const { userLevel, userData } = useAuth();
  const [data, setData] = useState<ReporterDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(unwrapApiResponse<ReporterDashboardResponse>(await getReporterDashboard()));
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLevel === "Patrol") void load();
    else setLoading(false);
  }, [userLevel]);

  if (userLevel !== "Patrol") {
    return (
      <RoleNotice
        message={userLevel ? "این داشبورد فقط برای مأمور گشت است." : "برای مشاهده داشبورد وارد حساب کاربری شوید."}
      />
    );
  }
  if (loading) return <PageSkeleton />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!data) return null;

  const returnedCount = data.recentReports.filter(
    (report) => report.review_status === "returned",
  ).length;

  return (
    <div>
      <DashboardHeader
        title="داشبورد من"
        description="وضعیت شیفت و گزارش‌های ثبت‌شده خود را دنبال کنید."
        onRefresh={() => void load()}
        loading={loading}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PanelCard className="md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">مأمور گشت</p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {[userData?.first_name, userData?.last_name].filter(Boolean).join(" ") || "کاربر"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">کد پرسنلی: {userData?.personnel_code || "ثبت نشده"}</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              شیفت جاری
            </span>
          </div>

          {data.activeShift ? (
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <InfoRow label="نوع شیفت" value={data.activeShift.shift_type} />
              <InfoRow label="شروع" value={formatDate(data.activeShift.start_at)} />
              <InfoRow
                label="واحد گشت"
                value={data.activeShift.patrol_unit?.name || data.activeShift.patrol_unit?.code}
              />
              <InfoRow label="خودرو" value={data.activeShift.vehicle?.plaque_no} />
            </div>
          ) : (
            <div className="mt-5">
              <Notice tone="amber">اطلاعات شیفت فعال در دسترس نیست.</Notice>
            </div>
          )}
        </PanelCard>

        <section className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 shadow-xl">
          <p className="text-xs text-blue-200">نیازمند اقدام</p>
          <p className="mt-2 text-4xl font-bold text-white">{returnedCount.toLocaleString("fa-IR")}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">گزارش برگشت‌خورده در فهرست اخیر</p>
        </section>
      </div>

      <PanelCard title="خلاصه وضعیت" className="mt-5">
        <SummaryMetrics summary={data.summary} />
      </PanelCard>

      <PanelCard title="گزارش‌های اخیر" className="mt-5">
        <ReportList reports={data.recentReports} />
      </PanelCard>
    </div>
  );
}
