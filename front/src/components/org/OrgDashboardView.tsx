"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getOrganization } from "@/app/actions/organization/getOrganization";
import { getOrgChart } from "@/app/actions/unit/getOrgChart";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { OrgChartResponse, OrganizationListItem, OrgChartStats, UnitType } from "@/services/org-projections";
import { UNIT_TYPE_LABELS, UNIT_TYPE_TONES } from "@/utils/org";
import { useOrgModules } from "@/hooks/useOrgModules";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { ProcessPreview } from "@/components/org/ProcessPreview";
import { OrgAnalyticsPanel } from "@/components/org/OrgAnalyticsPanel";

export function OrgDashboardView({ orgId }: { orgId: string }) {
  const [org, setOrg] = useState<OrganizationListItem | null>(null);
  const [stats, setStats] = useState<OrgChartStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { has: orgHasModule } = useOrgModules(orgId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const organization = unwrapApiResponse<OrganizationListItem>(await getOrganization({ set: { _id: orgId } }));
      const chart = unwrapApiResponse<OrgChartResponse>(await getOrgChart({ set: { orgId }, get: { organization: 1, stats: 1 } }));
      setOrg(organization);
      setStats(Array.isArray(chart.stats) ? chart.stats : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton blocks={[96, 160, 240]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!org) return null;

  const totalUnits = (stats || []).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const presentTypes = (stats || []).filter((item) => Number(item.count) > 0);

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-l from-blue-950/70 via-slate-900 to-slate-900 p-5 shadow-xl sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] ${org.is_active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-rose-400/25 bg-rose-400/10 text-rose-200"}`}>
              {org.is_active ? "فعال" : "غیرفعال"}
            </span>
            <span className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-0.5 font-mono text-[11px] text-slate-400" dir="ltr">
              {org.code}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-white">{org.name}</h1>
          {org.enName && <p className="mt-1 text-xs text-slate-500" dir="ltr">{org.enName}</p>}
          {org.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{org.description}</p>}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
            <span>جاده/آزادراه: <span className="text-slate-200">{org.road?.name || "—"}</span></span>
            <span>
              سرپرست:{" "}
              <span className="text-slate-200">
                {org.head ? `${org.head.first_name || ""} ${org.head.last_name || ""}`.trim() || "—" : "—"}
              </span>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/org/${orgId}/units/new`} className="rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
            + واحد جدید
          </Link>
          <Link href={`/org/${orgId}/org-chart`} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,.18)] transition hover:bg-blue-500">
            نمودار سازمانی
          </Link>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="کل واحدها" value={totalUnits.toLocaleString("fa-IR")} />
        <KpiCard label="گشت‌ها" value={countFor(stats, "Patrol").toLocaleString("fa-IR")} />
        <KpiCard label="پاسگاه‌ها" value={countFor(stats, "Station").toLocaleString("fa-IR")} />
        <KpiCard label="واحدهای ستادی" value={(totalUnits - countFor(stats, "Patrol") - countFor(stats, "Station")).toLocaleString("fa-IR")} />
      </div>

      <ProcessPreview orgId={orgId} />

      <OrgAnalyticsPanel orgId={orgId} />

      {presentTypes.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {presentTypes.map((item) => (
            <span key={item._id} className={`rounded-full border px-3 py-1.5 text-xs ${UNIT_TYPE_TONES[item._id as UnitType] || UNIT_TYPE_TONES.General}`}>
              {UNIT_TYPE_LABELS[item._id as UnitType] || item._id} · {Number(item.count).toLocaleString("fa-IR")}
            </span>
          ))}
        </div>
      ) : null}

      {totalUnits === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-10 text-center">
          <p className="text-sm text-slate-300">این سازمان هنوز واحدی ندارد.</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
            اولین گام، ایجاد واحد «ستاد» (HQ) به‌عنوان ریشه نمودار سازمانی است؛ سپس پاسگاه‌ها و واحدهای گشت را زیر آن بسازید.
          </p>
          <Link href={`/org/${orgId}/units/new`} className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,.18)] transition hover:bg-blue-500">
            ایجاد اولین واحد
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link href={`/org/${orgId}/org-chart`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-blue-400/25">
            <p className="text-sm font-semibold text-white">نمایش درخت سازمانی</p>
            <p className="mt-1 text-xs text-slate-500">مشاهده سلسله‌مراتب واحدها با سرپرستان</p>
          </Link>
          <Link href={`/org/${orgId}/units`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-blue-400/25">
            <p className="text-sm font-semibold text-white">مدیریت واحدها</p>
            <p className="mt-1 text-xs text-slate-500">لیست، ویرایش، سرپرست و اعضا</p>
          </Link>
          <Link href={`/org/${orgId}/people`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-blue-400/25">
            <p className="text-sm font-semibold text-white">افراد و نقش‌ها</p>
            <p className="mt-1 text-xs text-slate-500">افزودن افراد و انتصاب نقش سازمانی</p>
          </Link>
          {orgHasModule("incident_patrol") && (
            <Link href={`/org/${orgId}/processes`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-blue-400/25">
              <p className="text-sm font-semibold text-white">فرایندهای ثبت رخداد</p>
              <p className="mt-1 text-xs text-slate-500">ساخت و فعال‌سازی پرسشنامه موبایل</p>
            </Link>
          )}
          {orgHasModule("warehouse") && (
            <Link href={`/org/${orgId}/inventory`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-blue-400/25">
              <p className="text-sm font-semibold text-white">انبار و موجودی</p>
              <p className="mt-1 text-xs text-slate-500">موجودی، درخواست‌ها و گردش کالا</p>
            </Link>
          )}
          {orgHasModule("incident_patrol") && (
            <Link href={`/org/${orgId}/reports`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-blue-400/25">
              <p className="text-sm font-semibold text-white">گزارش‌های رخداد</p>
              <p className="mt-1 text-xs text-slate-500">فیلتر بر اساس نوع رخداد و شدت</p>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-blue-500 to-cyan-400" />
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{value}</p>
    </div>
  );
}

function countFor(stats: OrgChartStats | null, type: UnitType): number {
  const found = (stats || []).find((item) => item._id === type);
  return found ? Number(found.count) : 0;
}
