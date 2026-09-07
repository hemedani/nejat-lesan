"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getUser } from "@/app/actions/user/getUser";
import { updateUserPure } from "@/app/actions/user/updateUser";
import { updateUserRoles } from "@/app/actions/user/addOrRemoveRoles";
import { getUnits } from "@/app/actions/unit/getUnits";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { UnitListItem } from "@/services/org-projections";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import { PanelCard, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { OrgSelect } from "@/components/org/OrgSelect";
import {
  MANAGER_LEVEL_OPTIONS,
  MEMBER_LEVEL_OPTIONS,
  ORG_ROLE_LABELS,
  ORG_ROLE_OPTIONS,
  ORG_ROLE_TONES,
  scopeLabel,
  type OrgRoleName,
  type OrgRoleRow,
} from "@/components/org/role-helpers";

interface PersonProfile {
  _id: string;
  first_name?: string;
  last_name?: string;
  father_name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  personnel_code?: string;
  level?: string;
  roles?: OrgRoleRow[];
}

export function PeopleDetailView({ orgId, userId }: { orgId: string; userId: string }) {
  const router = useRouter();
  const { userLevel } = useAuth();
  const [person, setPerson] = useState<PersonProfile | null>(null);
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [pendingRoleName, setPendingRoleName] = useState<OrgRoleName>("UnitHead");
  const [pendingUnitId, setPendingUnitId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = unwrapApiResponse<PersonProfile>(await getUser(userId));
      const unitRows = unwrapApiResponse<UnitListItem[]>(
        await getUnits({ set: { organizationId: orgId, limit: 200 } }),
      );
      setPerson(user);
      setUnits(Array.isArray(unitRows) ? unitRows : []);
      setPendingUnitId("");
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton blocks={[140, 260, 200]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!person) return null;

  const levelOptions = userLevel === "Ghost" || userLevel === "Manager" ? MANAGER_LEVEL_OPTIONS : MEMBER_LEVEL_OPTIONS;
  const unitOptions = units.map((u) => ({ value: u._id, label: u.name }));
  const unitNameMap: Record<string, string> = {};
  for (const u of units) unitNameMap[u._id] = u.name;

  const addRole = async () => {
    const addRoles: OrgRoleRow[] = [];
    if (pendingRoleName === "OrgHead") {
      if ((person.roles || []).some((r) => r.name === "OrgHead" && r.scopeId === orgId)) {
        toast.error("این نقش قبلاً ثبت شده است.");
        return;
      }
      addRoles.push({ name: "OrgHead", scopeType: "organization", scopeId: orgId });
    } else {
      if (!pendingUnitId) {
        toast.error("برای نقش واحد، ابتدا واحد را انتخاب کنید.");
        return;
      }
      if ((person.roles || []).some((r) => r.name === pendingRoleName && r.scopeId === pendingUnitId)) {
        toast.error("این نقش قبلاً ثبت شده است.");
        return;
      }
      addRoles.push({ name: pendingRoleName, scopeType: "unit", scopeId: pendingUnitId });
    }
    setBusy(true);
    try {
      const response = await updateUserRoles({ _id: userId, addRoles });
      if (response.success) {
        toast.success("نقش اضافه شد.");
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در افزودن نقش.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const removeRole = async (role: OrgRoleRow) => {
    setBusy(true);
    try {
      const response = await updateUserRoles({ _id: userId, removeRoles: [role] });
      if (response.success) {
        toast.success("نقش حذف شد.");
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در حذف نقش.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    setBusy(true);
    try {
      const response = await updateUserPure({
        _id: userId,
        first_name: person.first_name,
        last_name: person.last_name,
        personnel_code: person.personnel_code,
        level: person.level as never,
      });
      if (response.success) {
        toast.success("اطلاعات ذخیره شد.");
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در ذخیره‌سازی.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const setPersonField = (key: keyof PersonProfile, value: string) => {
    setPerson({ ...person, [key]: value });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">افراد و نقش‌ها</p>
          <h1 className="text-2xl font-bold text-white">{`${person.first_name || ""} ${person.last_name || ""}`.trim() || "کاربر"}</h1>
          {person.email && <p className="mt-1 text-xs text-slate-500" dir="ltr">{person.email}</p>}
        </div>
        <Button variant="secondary" onClick={() => router.push(`/org/${orgId}/people`)}>بازگشت به لیست</Button>
      </div>

      <PanelCard title="اطلاعات پایه">
        <div className="grid gap-4 sm:grid-cols-2">
          <MyInput label="نام" value={person.first_name || ""} onValueChange={(v) => setPersonField("first_name", v)} variant="dark" />
          <MyInput label="نام خانوادگی" value={person.last_name || ""} onValueChange={(v) => setPersonField("last_name", v)} variant="dark" />
          <MyInput label="کد پرسنلی" value={person.personnel_code || ""} onValueChange={(v) => setPersonField("personnel_code", v)} variant="dark" />
          {person.mobile && <p className="flex items-end px-1 pb-2 text-xs text-slate-500">موبایل: <span className="mr-1 text-slate-300" dir="ltr">{person.mobile}</span></p>}
          <OrgSelect
            label="سطح دسترسی"
            value={person.level || ""}
            onChange={(v) => setPersonField("level", v)}
            options={levelOptions}
            placeholder="انتخاب سطح"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void saveProfile()} loading={busy} disabled={busy}>ذخیره اطلاعات</Button>
        </div>
      </PanelCard>

      <PanelCard title={`نقش‌های سازمانی (${(person.roles || []).length.toLocaleString("fa-IR")})`}>
        {(person.roles?.length || 0) > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {person.roles!.map((role, i) => (
              <span key={`${role.name}-${i}`} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${ORG_ROLE_TONES[role.name] || "border-white/10 text-slate-200"}`}>
                {ORG_ROLE_LABELS[role.name] || role.name}
                {scopeLabel(role, unitNameMap, orgId) ? <span className="opacity-70">· {scopeLabel(role, unitNameMap, orgId)}</span> : null}
                <button disabled={busy} onClick={() => void removeRole(role)} className="text-rose-300 hover:text-rose-200" aria-label="حذف نقش">×</button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/[.02] p-3">
          <div className="w-56">
            <OrgSelect label="نقش جدید" value={pendingRoleName} onChange={(v) => setPendingRoleName(v as OrgRoleName)} options={ORG_ROLE_OPTIONS} />
          </div>
          {pendingRoleName !== "OrgHead" && (
            <div className="w-64">
              <OrgSelect label="واحد" value={pendingUnitId} onChange={setPendingUnitId} options={unitOptions} placeholder="انتخاب واحد" />
            </div>
          )}
          <Button variant="secondary" onClick={() => void addRole()} loading={busy} disabled={busy}>افزودن نقش</Button>
        </div>
      </PanelCard>
    </div>
  );
}
