"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getOrganizations } from "@/app/actions/organization/getOrganizations";
import { countOrganizations } from "@/app/actions/organization/countOrganizations";
import { addOrganization } from "@/app/actions/organization/addOrganization";
import { updateOrganization } from "@/app/actions/organization/updateOrganization";
import { removeOrganization } from "@/app/actions/organization/removeOrganization";
import { gets as getRoads } from "@/app/actions/road/gets";
import { getUsers } from "@/app/actions/user/getUsers";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { OrganizationListItem } from "@/services/org-projections";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import ToggleSwitch from "@/components/atoms/ToggleSwitch";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { ModalShell, OrgFilterSelect, OrgSelect } from "@/components/org/OrgSelect";

interface RoadOption {
  _id: string;
  name: string;
  origin?: string;
  destination?: string;
}

interface ManagerUser {
  _id: string;
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  is_active?: boolean;
}

const toErrorMessage = (cause: unknown) => getPatrolErrorMessage(cause instanceof Error ? cause : new Error(String(cause)));

export function OrgIndexView() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

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
          <Button onClick={() => setShowCreate(true)}>+ افزودن سازمان</Button>
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
              <button onClick={() => router.push(`/org/${org._id}`)} className="flex flex-1 flex-col text-right">
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
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                <div className="flex items-center gap-2">
                  <ToggleSwitch checked={!!org.is_active} onChange={() => void toggleActive(org)} />
                  <span className="text-[11px] text-slate-500">فعال بودن</span>
                </div>
                <button onClick={() => void handleRemove(org)} className="text-xs text-rose-300/80 transition hover:text-rose-200">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateOrgModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function CreateOrgModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [enName, setEnName] = useState("");
  const [description, setDescription] = useState("");
  const [roadId, setRoadId] = useState("");
  const [headId, setHeadId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [roads, setRoads] = useState<RoadOption[]>([]);
  const [managers, setManagers] = useState<ManagerUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const roadRes = unwrapApiResponse<RoadOption[]>(await getRoads({ set: { page: 1, limit: 200 }, get: { _id: 1, name: 1, origin: 1, destination: 1 } }));
        if (alive && Array.isArray(roadRes)) setRoads(roadRes);
      } catch {
        if (alive) setRoads([]);
      }
      try {
        const users = await getUsers({
          set: { levels: "Manager", page: 1, limit: 200 },
          get: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1, is_active: 1 },
        });
        if (alive && Array.isArray(users)) setManagers(users as ManagerUser[]);
      } catch {
        if (alive) setManagers([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const roadOptions = roads.map((road) => ({
    value: road._id,
    label: [road.name, road.origin, road.destination].filter(Boolean).join(" — "),
  }));
  const managerOptions = managers
    .filter((u) => u.is_active !== false)
    .map((user) => ({
      value: user._id,
      label: [`${user.first_name || ""} ${user.last_name || ""}`.trim(), user.personnel_code].filter(Boolean).join(" · "),
    }));

  const handleSubmit = async () => {
    setFormError(null);
    if (!code.trim() || !name.trim()) {
      setFormError("کد و نام سازمان الزامی است.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await addOrganization({
        set: {
          code: code.trim(),
          name: name.trim(),
          enName: enName.trim() || undefined,
          description: description.trim() || undefined,
          is_active: isActive,
          ...(roadId ? { roadId } : {}),
          headId: headId || undefined,
        },
      });
      if (response.success) {
        toast.success("سازمان با موفقیت ایجاد شد.");
        onCreated();
      } else {
        setFormError((response.body as { message?: string } | undefined)?.message || "خطا در ایجاد سازمان.");
      }
    } catch (cause) {
      setFormError(toErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="افزودن سازمان" onClose={onClose}>
      <div className="space-y-4">
        <MyInput label="کد سازمان" value={code} onValueChange={setCode} variant="dark" placeholder="مثلاً ORG-001" />
        <MyInput label="نام سازمان" value={name} onValueChange={setName} variant="dark" placeholder="نام فارسی جاده/آزادراه یا شهرداری" />
        <MyInput label="نام انگلیسی" value={enName} onValueChange={setEnName} variant="dark" placeholder="(اختیاری)" />
        <OrgSelect label="جاده/آزادراه" value={roadId} onChange={setRoadId} options={roadOptions} placeholder="(اختیاری — برای شهرداری‌ها خالی بگذارید)" />
        <OrgSelect label="سرپرست سازمان" value={headId} onChange={setHeadId} options={managerOptions} placeholder="(اختیاری)" />
        <MyInput label="توضیحات" type="textarea" value={description} onValueChange={setDescription} variant="dark" />
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.02] px-3 py-3">
          <span className="text-sm text-slate-300">سازمان فعال باشد</span>
          <ToggleSwitch checked={isActive} onChange={setIsActive} />
        </div>
        {formError && <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{formError}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="neutral" onClick={onClose}>انصراف</Button>
          <Button onClick={() => void handleSubmit()} loading={submitting} disabled={submitting}>
            {submitting ? "در حال ثبت..." : "ثبت سازمان"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
