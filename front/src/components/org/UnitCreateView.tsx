"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getOrganization } from "@/app/actions/organization/getOrganization";
import { getUnits } from "@/app/actions/unit/getUnits";
import { addUnit } from "@/app/actions/unit/addUnit";
import { getPatrolOfficers } from "@/app/actions/user/getPatrolOfficers";
import { getUsers } from "@/app/actions/user/getUsers";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { OrganizationListItem, UnitListItem, UnitType } from "@/services/org-projections";
import { UNIT_TYPE_LABELS } from "@/utils/org";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import ToggleSwitch from "@/components/atoms/ToggleSwitch";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { OrgSelect } from "@/components/org/OrgSelect";

interface HeadOption {
  _id: string;
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  level?: string;
  is_active?: boolean;
}

export function UnitCreateView({ orgId }: { orgId: string }) {
  const router = useRouter();

  const [org, setOrg] = useState<OrganizationListItem | null>(null);
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [headOptions, setHeadOptions] = useState<HeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<UnitType>("General");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [headTitle, setHeadTitle] = useState("");
  const [parentUnitId, setParentUnitId] = useState("");
  const [headId, setHeadId] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const organization = unwrapApiResponse<OrganizationListItem>(await getOrganization({ set: { _id: orgId } }));
        const siblings = unwrapApiResponse<UnitListItem[]>(await getUnits({ set: { organizationId: orgId, limit: 200 } }));
        if (!alive) return;
        setOrg(organization);
        setUnits(Array.isArray(siblings) ? siblings : []);
      } catch (cause) {
        if (alive) setError(getPatrolErrorMessage(cause));
      } finally {
        if (alive) setLoading(false);
      }

      try {
        const officerRes = await getPatrolOfficers({
          set: { page: 1, limit: 100, is_active: true },
          get: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1, level: 1 },
        });
        const officers: HeadOption[] =
          officerRes.success && Array.isArray(officerRes.body) ? (officerRes.body as HeadOption[]) : [];
        const managers = await getUsers({
          set: { levels: "Manager", page: 1, limit: 100 },
          get: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1, level: 1, is_active: 1 },
        });
        if (!alive) return;
        const merged: HeadOption[] = [
          ...officers,
          ...(Array.isArray(managers) ? (managers as HeadOption[]).filter((u) => u.is_active !== false) : []),
        ];
        const seen = new Set<string>();
        setHeadOptions(merged.filter((o) => (seen.has(o._id) ? false : (seen.add(o._id), true))));
      } catch {
        if (alive) setHeadOptions([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orgId]);

  const parentOptions = units
    .filter((u) => u.type !== "Patrol" || type === "Patrol")
    .map((u) => ({ value: u._id, label: `${UNIT_TYPE_LABELS[u.type] || u.type} · ${u.name}` }));

  const headOptionsSelect = headOptions.map((u) => ({
    value: u._id,
    label: [`${u.first_name || ""} ${u.last_name || ""}`.trim(), u.personnel_code || "", u.level || ""].filter(Boolean).join(" · "),
  }));

  const typeOptions = (Object.keys(UNIT_TYPE_LABELS) as UnitType[]).map((t) => ({ value: t, label: UNIT_TYPE_LABELS[t] }));

  const handleSubmit = async () => {
    setFormError(null);
    if (!code.trim() || !name.trim()) {
      setFormError("کد و نام واحد الزامی است.");
      return;
    }
    setSubmitting(true);
    try {
      const roadId = org?.road?._id;
      const response = await addUnit({
        set: {
          code: code.trim(),
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          head_title: headTitle.trim() || undefined,
          is_active: isActive,
          features: [],
          organizationId: orgId,
          ...(roadId ? { roadId } : {}),
          parentUnitId: parentUnitId || undefined,
          headId: headId || undefined,
        },
      });
      if (response.success && response.body?._id) {
        toast.success("واحد با موفقیت ایجاد شد.");
        router.push(`/org/${orgId}/units/${(response.body as { _id: string })._id}`);
      } else {
        const message = (response.body as { message?: string } | undefined)?.message || "";
        setFormError(getPatrolErrorMessage(new Error(message)));
      }
    } catch (cause) {
      setFormError(getPatrolErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton blocks={[120, 320]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => window.location.reload()} />;
  if (!org) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <p className="text-sm text-blue-300">ایجاد واحد</p>
        <h1 className="mt-1 text-2xl font-bold text-white">واحد جدید در «{org.name}»</h1>
        <p className="mt-2 text-sm text-slate-500">برای ساخت نمودار، ابتدا واحد ستاد را بدون «زیرمجموعه» بسازید؛ سپس بقیه واحدها را زیر آن تعریف کنید.</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <MyInput label="کد واحد" value={code} onValueChange={setCode} variant="dark" placeholder="مثلاً UN-001" />
          <MyInput label="نام واحد" value={name} onValueChange={setName} variant="dark" placeholder="مثلاً گشت آزادراه تهران-قم" />
        </div>
        <OrgSelect label="نوع واحد" value={type} onChange={(value) => setType(value as UnitType)} options={typeOptions} placeholder="نوع واحد را انتخاب کنید" />
        <OrgSelect label="زیرمجموعه (واحد بالادست)" value={parentUnitId} onChange={setParentUnitId} options={parentOptions} placeholder="در صورت ایجاد ستاد، خالی بگذارید" />
        <OrgSelect label="سرپرست واحد" value={headId} onChange={setHeadId} options={headOptionsSelect} placeholder="(اختیاری)" />
        <MyInput label="عنوان سرپرست" value={headTitle} onValueChange={setHeadTitle} variant="dark" placeholder="(اختیاری) مثلاً رئیس گشت" />
        <MyInput label="تلفن" value={phone} onValueChange={setPhone} variant="dark" placeholder="(اختیاری)" />
        <MyInput label="نشانی" value={address} onValueChange={setAddress} variant="dark" placeholder="(اختیاری)" />
        <MyInput label="توضیحات" type="textarea" value={description} onValueChange={setDescription} variant="dark" />
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.02] px-3 py-3">
          <span className="text-sm text-slate-300">واحد فعال باشد</span>
          <ToggleSwitch checked={isActive} onChange={setIsActive} />
        </div>
        {formError && <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{formError}</p>}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button variant="neutral" onClick={() => router.push(`/org/${orgId}/units`)}>انصراف</Button>
          <Button onClick={() => void handleSubmit()} loading={submitting} disabled={submitting}>
            {submitting ? "در حال ثبت..." : "ثبت واحد"}
          </Button>
        </div>
      </div>
    </div>
  );
}
