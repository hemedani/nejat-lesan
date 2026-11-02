"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getModules as getInstallationModules } from "@/app/actions/app_modules/getModules";
import { setModules as setInstallationModules } from "@/app/actions/app_modules/setModules";
import { getOrganizations } from "@/app/actions/organization/getOrganizations";
import { getOrganizationModules } from "@/app/actions/organization/getModules";
import { setOrganizationModules } from "@/app/actions/organization/setModules";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { MODULE_KEYS, MODULE_LABELS } from "@/utils/org";
import type { ModuleKey } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/system/RoleNotice";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import ToggleSwitch from "@/components/atoms/ToggleSwitch";
import type { OrganizationListItem } from "@/services/org-projections";


type Tab = "installation" | "organizations";

export function ModuleConfigClient() {
  const { userLevel } = useAuth();
  const [tab, setTab] = useState<Tab>("installation");

  if (userLevel !== "Ghost") {
    return <RoleNotice message="تنظیمات ماژول‌ها فقط برای حساب مدیر نصب (Ghost) در دسترس است." />;
  }

  return (
    <div dir="rtl">
      <div className="mb-5">
        <p className="text-sm text-brand-fg">سیستم / فعال‌سازی</p>
        <h1 className="mt-1 text-2xl font-bold text-fg">تنظیمات ماژول‌ها</h1>
        <p className="mt-2 text-sm text-fg-faint">ماژول‌ها در دو لایه کنترل می‌شوند: سطح نصب و سطح هر سازمان. گزینهٔ مؤثر برای هر سازمان = نصب و سازمان.</p>
      </div>

      <div className="mb-5 flex gap-2">
        <TabButton active={tab === "installation"} onClick={() => setTab("installation")} label="سطح نصب" />
        <TabButton active={tab === "organizations"} onClick={() => setTab("organizations")} label="سطح سازمان‌ها" />
      </div>

      {tab === "installation" ? <InstallationModules /> : <OrganizationModules />}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm transition ${active ? "bg-brand text-on-brand shadow-[0_0_18px_rgba(37,99,235,.25)]" : "border border-line text-fg-muted hover:bg-surface-hover"}`}
    >
      {label}
    </button>
  );
}

function InstallationModules() {
  const { refreshModules } = useAuth();
  const [flags, setFlags] = useState<{ key: ModuleKey; enabled: boolean }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<ModuleKey | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const body = unwrapApiResponse<{ modules: { key: ModuleKey; enabled: boolean }[] }>(await getInstallationModules());
      setFlags(Array.isArray(body?.modules) ? body.modules : MODULE_KEYS.map((key) => ({ key, enabled: true })));
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (key: ModuleKey, enabled: boolean) => {
    if (!flags) return;
    setBusyKey(key);
    try {
      const response = await setInstallationModules({
        set: { modules: flags.map((f) => (f.key === key ? { ...f, enabled } : f)) },
      });
      if (response.success) {
        setFlags((prev) => (prev ? prev.map((f) => (f.key === key ? { ...f, enabled } : f)) : prev));
        toast.success(`ماژول ${MODULE_LABELS[key]} ${enabled ? "فعال شد" : "غیرفعال شد"}.`);
        void refreshModules();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در ذخیره‌سازی.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusyKey(null);
    }
  };

  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!flags) return <PageSkeleton blocks={[140, 140, 140]} />;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {flags.map((flag) => (
        <ModuleCard key={flag.key} title={MODULE_LABELS[flag.key]} enabled={flag.enabled} busy={busyKey === flag.key} onToggle={(v) => void toggle(flag.key, v)} />
      ))}
    </div>
  );
}

function ModuleCard({ title, enabled, busy, onToggle }: { title: string; enabled: boolean; busy: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface/70 p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-fg">{title}</span>
        <span className={`tint-rose tint-emerald rounded-full border px-2.5 py-1 text-[11px] ${enabled ? "border-tint-border bg-tint-soft text-tint-fg" : "border-tint-border bg-tint-soft text-tint-fg"}`}>
          {enabled ? "فعال" : "غیرفعال"}
        </span>
      </div>
      <p className="mt-2 flex-1 text-xs leading-5 text-fg-faint">{enabled ? "این ماژول برای کل نصب فعال است." : "این ماژول برای کل نصب غیرفعال است."}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-fg-muted">وضعیت</span>
        <ToggleSwitch checked={enabled} disabled={busy} onChange={onToggle} />
      </div>
    </div>
  );
}

function OrganizationModules() {
  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<OrganizationListItem[]>(await getOrganizations({ set: { page: 1, limit: 100 } }));
      setOrgs(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const filtered = orgs.filter((org) => !q || org.name?.toLowerCase().includes(q) || org.code?.toLowerCase().includes(q));

  if (loading) return <PageSkeleton blocks={[200, 200]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface/60 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی سازمان..."
          className="w-full rounded-xl border border-line bg-surface-sunken px-3 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-blue-400/50"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="سازمانی یافت نشد." />
      ) : (
        filtered.map((org) => <OrgModuleRow key={org._id} org={org} />)
      )}
    </div>
  );
}

function OrgModuleRow({ org }: { org: OrganizationListItem }) {
  const [effective, setEffective] = useState<string[] | null>(null);
  const [explicit, setExplicit] = useState<{ key: ModuleKey; enabled: boolean }[] | null>(null);
  const [deployment, setDeployment] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<ModuleKey | null>(null);

  const load = useCallback(async () => {
    try {
      const body = unwrapApiResponse<{
        deployment: string[];
        modules: { key: ModuleKey; enabled: boolean }[];
        effective: string[];
      }>(await getOrganizationModules({ set: { organizationId: org._id } }));
      setDeployment(Array.isArray(body?.deployment) ? body.deployment : []);
      setExplicit(Array.isArray(body?.modules) && body.modules.length > 0 ? body.modules : null);
      setEffective(Array.isArray(body?.effective) ? body.effective : []);
    } catch {
      setEffective([]);
    } finally {
      setLoading(false);
    }
  }, [org._id]);

  useEffect(() => {
    void load();
  }, [load]);

  const inheritFromInstallation = explicit === null;
  const isEnabled = (key: ModuleKey) => Boolean(effective?.includes(key));

  const toggle = async (key: ModuleKey, enabled: boolean) => {
    setBusyKey(key);
    try {
      const baseline = new Map<ModuleKey, boolean>();
      for (const k of MODULE_KEYS) baseline.set(k, inheritFromInstallation ? deployment.includes(k) : explicit?.find((f) => f.key === k)?.enabled ?? false);
      baseline.set(key, enabled);
      const modules = MODULE_KEYS.map((k) => ({ key: k, enabled: baseline.get(k) ?? false }));
      const response = await setOrganizationModules({ set: { organizationId: org._id, modules } });
      if (response.success) {
        toast.success(`ماژول ${MODULE_LABELS[key]} برای سازمان «${org.name}» ${enabled ? "فعال شد" : "غیرفعال شد"}.`);
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در ذخیره‌سازی.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) return <div className="h-28 animate-pulse rounded-2xl bg-surface-hover" />;

  return (
    <div className="rounded-2xl border border-line bg-surface/70 p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-fg">{org.name}</p>
          <p className="mt-0.5 text-xs text-fg-faint" dir="ltr">{org.code}</p>
        </div>
        <span className={`tint-amber rounded-full border px-2.5 py-1 text-[11px] ${inheritFromInstallation ? "border-line bg-surface-sunken text-fg-muted" : "border-tint-border bg-tint-soft text-tint-fg"}`}>
          {inheritFromInstallation ? "پیرو نصب" : "تنظیم اختصاصی"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {MODULE_KEYS.map((key) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-line bg-surface-sunken px-3 py-2.5">
            <span className="text-xs text-fg-muted">{MODULE_LABELS[key]}</span>
            <ToggleSwitch checked={isEnabled(key)} disabled={busyKey === key} onChange={(v) => void toggle(key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
