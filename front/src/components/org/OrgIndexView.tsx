"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getOrganizations } from "@/app/actions/organization/getOrganizations";
import { countOrganizations } from "@/app/actions/organization/countOrganizations";
import { updateOrganization } from "@/app/actions/organization/updateOrganization";
import { removeOrganization } from "@/app/actions/organization/removeOrganization";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { orgRoutes } from "@/utils/org-routes";
import { adminRecordRoutes } from "@/utils/admin-record-routes";
import { usePanelScope } from "@/components/system/PanelScopeProvider";
import type { OrganizationListItem } from "@/services/org-projections";
import { Button } from "@/components/atoms/Button";
import ToggleSwitch from "@/components/atoms/ToggleSwitch";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { OrgFilterSelect } from "@/components/org/OrgSelect";

export function OrgIndexView() {
  const router = useRouter();
  const { selectOrg } = usePanelScope();
  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<OrganizationListItem[]>(await getOrganizations());
      setOrgs(Array.isArray(data) ? data : []);
      const counted = unwrapApiResponse<{ qty: number }>(await countOrganizations());
      setTotalCount(counted?.qty || 0);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orgs.filter((org) => {
      if (activeFilter === "active" && !org.is_active) return false;
      if (activeFilter === "inactive" && org.is_active) return false;
      if (!q) return true;
      return org.name?.toLowerCase().includes(q) || org.code?.toLowerCase().includes(q) || org.enName?.toLowerCase().includes(q);
    });
  }, [orgs, query, activeFilter]);

  const toggleActive = async (org: OrganizationListItem) => {
    const response = await updateOrganization({ set: { _id: org._id, is_active: !org.is_active } });
    if (response.success) {
      toast.success(org.is_active ? "سازمان غیرفعال شد." : "سازمان فعال شد.");
      await load();
    } else {
      toast.error(getPatrolErrorMessage(new Error((response.body as { message?: string } | undefined)?.message || "")));
    }
  };

  const handleRemove = async (org: OrganizationListItem) => {
    if (!window.confirm(`حذف سازمان «${org.name}»؟ این عمل قابل بازگشت نیست.`)) return;
    const response = await removeOrganization({ set: { _id: org._id } });
    if (response.success) {
      toast.success("سازمان حذف شد.");
      await load();
    } else {
      const message = (response.body as { message?: string } | undefined)?.message || "";
      toast.error(getPatrolErrorMessage(new Error(message)));
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">مدیریت سازمان‌ها</p>
          <h1 className="mt-1 text-2xl font-bold text-white">سازمان‌ها</h1>
          <p className="mt-2 text-sm text-slate-500">سازمان‌ها را برای هر راه/شهرداری بسازید؛ از این‌جا وارد نمودار سازمانی و واحدهای آن شوید.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-slate-400">
            {totalCount.toLocaleString("fa-IR")} سازمان
          </span>
          <Button onClick={() => router.push("/admin/org/new")}>+ افزودن سازمان</Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو بر اساس نام یا کد..."
            className="w-full rounded-xl border border-white/10 bg-white/[.04] py-2.5 pl-3 pr-10 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
          />
        </div>
        <OrgFilterSelect
          value={activeFilter}
          onChange={setActiveFilter}
          options={[
            { value: "all", label: "همه" },
            { value: "active", label: "فعال" },
            { value: "inactive", label: "غیرفعال" },
          ]}
        />
      </div>

      {loading ? (
        <PageSkeleton blocks={[140, 140, 140]} />
      ) : error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : filtered.length === 0 ? (
        <EmptyState message="سازمانی یافت نشد. اولین سازمان را برای یک جاده/آزادراه یا شهرداری ایجاد کنید." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((org) => (
            <div key={org._id} className="group flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-xl transition hover:border-blue-400/25 hover:bg-slate-900">
              <button
                onClick={() => router.push(adminRecordRoutes.org(org._id))}
                className="flex flex-1 flex-col text-right"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] ${org.is_active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-rose-400/25 bg-rose-400/10 text-rose-200"}`}>
                    {org.is_active ? "فعال" : "غیرفعال"}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-0.5 font-mono text-[11px] text-slate-400" dir="ltr">
                    {org.code}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-white group-hover:text-blue-100">{org.name}</h3>
                {org.enName && <p className="mt-0.5 text-xs text-slate-500" dir="ltr">{org.enName}</p>}
                <p className="mt-3 line-clamp-2 text-xs leading-6 text-slate-400">{org.description || "بدون توضیحات"}</p>
              </button>
              <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>جاده/آزادراه</span>
                  <span className="text-slate-200">{org.road?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>سرپرست</span>
                  <span className="text-slate-200">{org.head ? `${org.head.first_name || ""} ${org.head.last_name || ""}`.trim() || "—" : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>مرکز عملیاتی</span>
                  <span className="text-slate-200">
                    {org.location?.coordinates?.length === 2
                      ? `${Number(org.location.coordinates[1]).toLocaleString("fa-IR", { maximumFractionDigits: 3 })}، ${Number(org.location.coordinates[0]).toLocaleString("fa-IR", { maximumFractionDigits: 3 })}`
                      : "ثبت نشده"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                <div className="flex items-center gap-2">
                  <ToggleSwitch checked={!!org.is_active} onChange={() => void toggleActive(org)} />
                  <span className="text-[11px] text-slate-500">فعال بودن</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Set the panel scope, then enter the panel. This is how
                      // Ghost/Manager browse across organizations: the org lives
                      // in `PanelScopeProvider`'s sessionStorage, not in the URL.
                      // The card itself now opens the detail page instead, so
                      // entering the panel is its own explicit action.
                      selectOrg(org._id);
                      router.push(orgRoutes.dashboard());
                    }}
                    className="text-xs text-blue-300/80 transition hover:text-blue-200"
                  >
                    ورود به پنل
                  </button>
                  <button onClick={() => void handleRemove(org)} className="text-xs text-rose-300/80 transition hover:text-rose-200">
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

