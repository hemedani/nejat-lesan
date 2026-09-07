"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getUnit } from "@/app/actions/unit/getUnit";
import { updateUnit } from "@/app/actions/unit/updateUnit";
import { updateUnitRelations } from "@/app/actions/unit/updateUnitRelations";
import { removeUnit } from "@/app/actions/unit/removeUnit";
import { getUnits } from "@/app/actions/unit/getUnits";
import { getPatrolOfficers } from "@/app/actions/user/getPatrolOfficers";
import { getVehicles } from "@/app/actions/vehicle/gets";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { UnitListItem, UnitType } from "@/services/org-projections";
import { UNIT_TYPE_LABELS, UNIT_TYPE_TONES } from "@/utils/org";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import ToggleSwitch from "@/components/atoms/ToggleSwitch";
import { PanelCard, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { OrgSelect } from "@/components/org/OrgSelect";

interface OfficerSummary {
  _id: string;
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  level?: string;
}

interface VehicleSummary {
  _id: string;
  plaque_no?: string;
  title?: string;
  is_active?: boolean;
}

export function UnitDetailView({ orgId, unitId }: { orgId: string; unitId: string }) {
  const router = useRouter();
  const [unit, setUnit] = useState<UnitListItem | null>(null);
  const [siblings, setSiblings] = useState<UnitListItem[]>([]);
  const [candidateOfficers, setCandidateOfficers] = useState<OfficerSummary[]>([]);
  const [candidateVehicles, setCandidateVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pureBusy, setPureBusy] = useState(false);
  const [membersBusy, setMembersBusy] = useState(false);
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<UnitListItem>(await getUnit({ set: { _id: unitId } }));
      const others = unwrapApiResponse<UnitListItem[]>(await getUnits({ set: { organizationId: orgId, limit: 200 } }));
      setUnit(data);
      setSiblings(Array.isArray(others) ? others.filter((u) => u._id !== unitId) : []);
      setSelectedOfficers([]);
      setSelectedVehicles([]);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId, unitId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadCandidates = useCallback(async () => {
    try {
      const officerRes = await getPatrolOfficers({
        set: { page: 1, limit: 200, is_active: true },
        get: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1, level: 1 },
      });
      const vehicleRes = await getVehicles({
        set: { page: 1, limit: 200, is_active: true },
        get: { _id: 1, plaque_no: 1, title: 1, is_active: 1 },
      });
      const officers = unwrapApiResponse<OfficerSummary[]>(officerRes);
      const vehicles = unwrapApiResponse<VehicleSummary[]>(vehicleRes);
      if (Array.isArray(officers)) setCandidateOfficers(officers);
      if (Array.isArray(vehicles)) setCandidateVehicles(vehicles);
    } catch {
      setCandidateOfficers([]);
      setCandidateVehicles([]);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const assignedOfficerIds = useMemo(() => new Set((unit as { officers?: OfficerSummary[] } | null)?.officers?.map((o) => o._id) || []), [unit]);
  const assignedVehicleIds = useMemo(() => new Set((unit as { vehicles?: VehicleSummary[] } | null)?.vehicles?.map((v) => v._id) || []), [unit]);

  const availableOfficers = candidateOfficers.filter((o) => !assignedOfficerIds.has(o._id));
  const availableVehicles = candidateVehicles.filter((v) => !assignedVehicleIds.has(v._id));

  const officers = (unit as { officers?: OfficerSummary[] } | null)?.officers || [];
  const vehicles = (unit as { vehicles?: VehicleSummary[] } | null)?.vehicles || [];

  if (loading) return <PageSkeleton blocks={[140, 300, 260]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!unit) return null;

  const parentOptions = siblings.map((u) => ({ value: u._id, label: `${UNIT_TYPE_LABELS[u.type] || u.type} · ${u.name}` }));
  const typeOptions = (Object.keys(UNIT_TYPE_LABELS) as UnitType[]).map((t) => ({ value: t, label: UNIT_TYPE_LABELS[t] }));
  const officerOptions = availableOfficers.map((o) => ({
    value: o._id,
    label: [`${o.first_name || ""} ${o.last_name || ""}`.trim(), o.personnel_code || ""].filter(Boolean).join(" · "),
  }));

  const savePure = async () => {
    setPureBusy(true);
    try {
      const response = await updateUnit({
        set: {
          _id: unit._id,
          code: unit.code,
          name: unit.name,
          type: unit.type,
          description: unit.description || undefined,
          address: unit.address || undefined,
          phone: unit.phone || undefined,
          head_title: unit.head_title || undefined,
          is_active: unit.is_active,
          features: [],
        },
      });
      if (response.success) {
        toast.success("تغییرات واحد ذخیره شد.");
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در ذخیره‌سازی.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setPureBusy(false);
    }
  };

  const saveRelations = async () => {
    setPureBusy(true);
    try {
      const response = await updateUnitRelations({
        set: {
          _id: unit._id,
          organizationId: orgId,
          parentUnitId: unit.parentUnit?._id || undefined,
          headId: unit.head?._id || undefined,
        },
      });
      if (response.success) {
        toast.success("ارتباطات واحد ذخیره شد.");
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در ذخیره‌سازی ارتباطات.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setPureBusy(false);
    }
  };

  const applyOfficers = async (officerIds: string[], removeOfficerIds: string[]) => {
    setMembersBusy(true);
    try {
      const response = await updateUnitRelations({ set: { _id: unit._id, officerIds, removeOfficerIds } });
      if (response.success) {
        toast.success("اعضای واحد به‌روزرسانی شد.");
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در به‌روزرسانی اعضا.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setMembersBusy(false);
    }
  };

  const applyVehicles = async (vehicleIds: string[], removeVehicleIds: string[]) => {
    setMembersBusy(true);
    try {
      const response = await updateUnitRelations({ set: { _id: unit._id, vehicleIds, removeVehicleIds } });
      if (response.success) {
        toast.success("خودروهای واحد به‌روزرسانی شد.");
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در به‌روزرسانی خودروها.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setMembersBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`حذف واحد «${unit.name}»؟ اگر واحد زیرمجموعه دارد ابتدا آن‌ها را حذف کنید.`)) return;
    const response = await removeUnit({ set: { _id: unit._id } });
    if (response.success) {
      toast.success("واحد حذف شد.");
      router.push(`/org/${orgId}/units`);
    } else {
      toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در حذف واحد.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{unit.name}</h1>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] ${UNIT_TYPE_TONES[unit.type] || UNIT_TYPE_TONES.General}`}>
              {UNIT_TYPE_LABELS[unit.type] || unit.type}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${unit.is_active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-rose-400/25 bg-rose-400/10 text-rose-200"}`}>
              {unit.is_active ? "فعال" : "غیرفعال"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500" dir="ltr">{unit.code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/org/${orgId}/org-chart`} className="rounded-xl border border-white/15 bg-white/[.06] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">نمودار</Link>
          <Button variant="danger" onClick={() => void handleDelete()}>حذف واحد</Button>
        </div>
      </div>

      <PanelCard title="اطلاعات واحد">
        <div className="grid gap-4 sm:grid-cols-2">
          <MyInput label="کد واحد" value={unit.code} onValueChange={(v) => setUnit({ ...unit, code: v })} variant="dark" />
          <MyInput label="نام واحد" value={unit.name} onValueChange={(v) => setUnit({ ...unit, name: v })} variant="dark" />
        </div>
        <div className="mt-4">
          <OrgSelect label="نوع واحد" value={unit.type} onChange={(v) => setUnit({ ...unit, type: v as UnitType })} options={typeOptions} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MyInput label="تلفن" value={unit.phone || ""} onValueChange={(v) => setUnit({ ...unit, phone: v })} variant="dark" />
          <MyInput label="عنوان سرپرست" value={unit.head_title || ""} onValueChange={(v) => setUnit({ ...unit, head_title: v })} variant="dark" />
        </div>
        <div className="mt-4">
          <MyInput label="نشانی" value={unit.address || ""} onValueChange={(v) => setUnit({ ...unit, address: v })} variant="dark" />
        </div>
        <div className="mt-4">
          <MyInput label="توضیحات" type="textarea" value={unit.description || ""} onValueChange={(v) => setUnit({ ...unit, description: v })} variant="dark" />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.02] px-3 py-3">
          <span className="text-sm text-slate-300">واحد فعال باشد</span>
          <ToggleSwitch checked={!!unit.is_active} onChange={(v) => setUnit({ ...unit, is_active: v })} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void savePure()} loading={pureBusy} disabled={pureBusy}>ذخیره اطلاعات</Button>
        </div>
      </PanelCard>

      <PanelCard title="ارتباطات (سازمان، واحد بالادست، سرپرست)">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[.02] px-3 py-3 text-sm">
            <p className="text-xs text-slate-500">سازمان / آزادراه</p>
            <p className="mt-1 text-slate-200">{unit.organization?.name || "—"}</p>
          </div>
          <OrgSelect
            label="زیرمجموعه (واحد بالادست)"
            value={unit.parentUnit?._id || ""}
            onChange={(v) => setUnit({ ...unit, parentUnit: v ? { _id: v, name: siblings.find((s) => s._id === v)?.name || "" } : undefined })}
            options={parentOptions}
            placeholder="ریشه (بدون واحد بالادست)"
          />
        </div>
        <div className="mt-4">
          <OrgSelect
            label="سرپرست واحد"
            value={unit.head?._id || ""}
            onChange={(v) => setUnit({ ...unit, head: v ? { _id: v } : undefined })}
            options={officerOptions.length ? officerOptions : []}
            placeholder={unit.head ? `${unit.head.first_name || ""} ${unit.head.last_name || ""}`.trim() || unit.head._id : "سرپرستی انتخاب نشده"}
          />
          {officerOptions.length === 0 && <p className="mt-1 text-xs text-slate-500">مأمور فعال دیگری برای انتصاب یافت نشد.</p>}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void saveRelations()} loading={pureBusy} disabled={pureBusy}>ذخیره ارتباطات</Button>
        </div>
      </PanelCard>

      <PanelCard title={`اعضای گشت (${officers.length.toLocaleString("fa-IR")})`}>
        {officers.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {officers.map((o) => (
              <div key={o._id} className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs text-slate-200">
                <span className="font-medium">{`${o.first_name || ""} ${o.last_name || ""}`.trim() || "مأمور"}</span>
                {o.personnel_code && <span className="text-slate-500" dir="ltr">{o.personnel_code}</span>}
                <button className="text-rose-300 transition hover:text-rose-200" disabled={membersBusy} onClick={() => void applyOfficers([], [o._id])} aria-label="حذف عضو">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {availableOfficers.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[.02] p-3">
            <p className="mb-2 text-xs text-slate-400">انتخاب مأموران برای افزودن</p>
            <div className="flex flex-wrap gap-2">
              {availableOfficers.map((o) => {
                const checked = selectedOfficers.includes(o._id);
                return (
                  <label key={o._id} className="flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5" style={{ borderColor: checked ? "rgba(96,165,250,.5)" : "rgba(255,255,255,.1)" }}>
                    <input type="checkbox" className="accent-blue-500" checked={checked} onChange={() => setSelectedOfficers((prev) => (checked ? prev.filter((id) => id !== o._id) : [...prev, o._id]))} />
                    {`${o.first_name || ""} ${o.last_name || ""}`.trim() || o._id}
                    {o.personnel_code && <span className="text-slate-500" dir="ltr">{o.personnel_code}</span>}
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" disabled={membersBusy || selectedOfficers.length === 0} onClick={() => { void applyOfficers(selectedOfficers, []); setSelectedOfficers([]); }}>
                افزودن ({selectedOfficers.length.toLocaleString("fa-IR")})
              </Button>
            </div>
          </div>
        )}
      </PanelCard>

      <PanelCard title={`خودروهای واحد (${vehicles.length.toLocaleString("fa-IR")})`}>
        {vehicles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {vehicles.map((v) => (
              <div key={v._id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-slate-200">
                <span className="font-mono" dir="ltr">{v.plaque_no || "—"}</span>
                {v.title && <span className="text-slate-500">{v.title}</span>}
                <button className="text-rose-300 transition hover:text-rose-200" disabled={membersBusy} onClick={() => void applyVehicles([], [v._id])} aria-label="حذف خودرو">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {availableVehicles.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[.02] p-3">
            <p className="mb-2 text-xs text-slate-400">انتخاب خودرو برای افزودن</p>
            <div className="flex flex-wrap gap-2">
              {availableVehicles.map((v) => {
                const checked = selectedVehicles.includes(v._id);
                return (
                  <label key={v._id} className="flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5" style={{ borderColor: checked ? "rgba(96,165,250,.5)" : "rgba(255,255,255,.1)" }}>
                    <input type="checkbox" className="accent-blue-500" checked={checked} onChange={() => setSelectedVehicles((prev) => (checked ? prev.filter((id) => id !== v._id) : [...prev, v._id]))} />
                    <span className="font-mono" dir="ltr">{v.plaque_no || v._id}</span>
                    {v.title && <span className="text-slate-500">{v.title}</span>}
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" disabled={membersBusy || selectedVehicles.length === 0} onClick={() => { void applyVehicles(selectedVehicles, []); setSelectedVehicles([]); }}>
                افزودن ({selectedVehicles.length.toLocaleString("fa-IR")})
              </Button>
            </div>
          </div>
        )}
      </PanelCard>
    </div>
  );
}
