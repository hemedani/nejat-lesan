"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { z } from "zod";
import { createUser } from "@/app/actions/user/createUser";
import { getUnits } from "@/app/actions/unit/getUnits";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { UnitListItem } from "@/services/org-projections";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { OrgSelect } from "@/components/org/OrgSelect";
import {
  MANAGER_LEVEL_OPTIONS,
  MEMBER_LEVEL_OPTIONS,
} from "@/components/org/role-helpers";

const LEVELS = ["Manager", "OrgHead", "UnitHead", "Editor", "Enterprise", "Patrol"] as const;

// هم‌راستا با الگوی موبایل سمت سرور: (0|98|0098|+) + 9... (۱۰ رقم پس از پیشوند)
const MOBILE_PATTERN = /^(\+98|0|98|0098)?([ ]|-|[()]){0,2}9[0-9]([ ]|-|[()]){0,2}(?:[0-9]([ ]|-|[()]){0,2}){8}$/;
const EMAIL_PATTERN = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

const PersonCreateSchema = z
  .object({
    first_name: z.string().trim().min(1, "نام الزامی است"),
    last_name: z.string().trim().min(1, "نام خانوادگی الزامی است"),
    father_name: z.string().trim().min(1, "نام پدر الزامی است"),
    national_number: z.string().trim().regex(/^[0-9]{10}$/, "کد ملی باید ۱۰ رقم باشد"),
    mobile: z.string().trim().regex(MOBILE_PATTERN, "شماره موبایل معتبر نیست (مثلاً 09123456789)"),
    email: z.string().trim().regex(EMAIL_PATTERN, "ایمیل معتبر وارد کنید"),
    password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد").max(100, "رمز عبور باید حداکثر ۱۰۰ کاراکتر باشد"),
    gender: z.enum(["Male", "Female"]),
    level: z.enum(LEVELS),
    unit_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.level === "UnitHead" && !data.unit_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["unit_id"], message: "برای سرپرست واحد، انتخاب واحد الزامی است" });
    }
  });

type PersonValues = z.infer<typeof PersonCreateSchema>;

export function PeopleAddView({ orgId }: { orgId: string }) {
  const router = useRouter();
  const { userLevel } = useAuth();
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PersonValues, string>>>({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [nationalNumber, setNationalNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("Male");
  const [level, setLevel] = useState("Patrol");
  const [unitId, setUnitId] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const unitRows = unwrapApiResponse<UnitListItem[]>(
          await getUnits({ set: { organizationId: orgId, limit: 200 } }),
        );
        if (alive) setUnits(Array.isArray(unitRows) ? unitRows : []);
      } catch (cause) {
        if (alive) setError(getPatrolErrorMessage(cause));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orgId]);

  const levelOptions = userLevel === "Ghost" || userLevel === "Manager" ? MANAGER_LEVEL_OPTIONS : MEMBER_LEVEL_OPTIONS;
  const unitOptions = units.map((u) => ({ value: u._id, label: u.name }));

  // سطح سرپرست واحد (و مامور) نیازمند انتخاب واحد است؛ سرپرست سازمان به همین سازمان گره می‌خورد.
  const needsUnit = level === "UnitHead" || level === "Patrol";

  const buildRoles = () => {
    if (level === "OrgHead") {
      return [{ name: "OrgHead" as const, scopeType: "organization" as const, scopeId: orgId }];
    }
    if (level === "UnitHead") {
      return unitId
        ? [{ name: "UnitHead" as const, scopeType: "unit" as const, scopeId: unitId }]
        : [];
    }
    if (level === "Patrol") {
      return unitId
        ? [{ name: "Officer" as const, scopeType: "unit" as const, scopeId: unitId }]
        : [];
    }
    return [];
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFieldErrors({});

    const values: PersonValues = {
      first_name: firstName,
      last_name: lastName,
      father_name: fatherName,
      national_number: nationalNumber,
      mobile,
      email,
      password,
      gender: gender as "Male" | "Female",
      level: level as (typeof LEVELS)[number],
      unit_id: unitId,
    };
    const parsed = PersonCreateSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof PersonValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof PersonValues;
        if (key && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const response = await createUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        father_name: fatherName.trim(),
        national_number: nationalNumber.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        password,
        address: address.trim(),
        gender: gender as "Male" | "Female",
        level: level as never,
        is_verified: true,
        is_active: true,
        roles: buildRoles(),
      });
      if (response.success && response.body?._id) {
        toast.success("فرد با موفقیت اضافه شد.");
        router.push(`/org/${orgId}/people/${(response.body as { _id: string })._id}`);
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

  if (loading) return <PageSkeleton blocks={[120, 300]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <p className="text-sm text-blue-300">افراد و نقش‌ها</p>
        <h1 className="mt-1 text-2xl font-bold text-white">افزودن فرد جدید</h1>
        <p className="mt-2 text-sm text-slate-500">
          با انتخاب سطح دسترسی، نقش سازمانی (سرپرست/مامور) به‌صورت خودکار بر پایه سازمان/واحد ساخته می‌شود.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <MyInput label="نام" value={firstName} onValueChange={setFirstName} variant="dark" errMsg={fieldErrors.first_name} />
          <MyInput label="نام خانوادگی" value={lastName} onValueChange={setLastName} variant="dark" errMsg={fieldErrors.last_name} />
          <MyInput label="نام پدر" value={fatherName} onValueChange={setFatherName} variant="dark" errMsg={fieldErrors.father_name} />
          <MyInput label="کد ملی" value={nationalNumber} onValueChange={setNationalNumber} variant="dark" placeholder="۱۰ رقم" errMsg={fieldErrors.national_number} />
          <MyInput label="شماره موبایل" value={mobile} onValueChange={setMobile} variant="dark" placeholder="09xxxxxxxxx" errMsg={fieldErrors.mobile} />
          <MyInput label="ایمیل" value={email} onValueChange={setEmail} variant="dark" errMsg={fieldErrors.email} />
          <MyInput label="رمز عبور (حداقل ۸ کاراکتر)" value={password} onValueChange={setPassword} variant="dark" type="password" errMsg={fieldErrors.password} />
          <MyInput label="نشانی" value={address} onValueChange={setAddress} variant="dark" />
          <OrgSelect label="جنسیت" value={gender} onChange={setGender} errMsg={fieldErrors.gender} options={[{ value: "Male", label: "مرد" }, { value: "Female", label: "زن" }]} />
          <OrgSelect label="سطح دسترسی" value={level} onChange={setLevel} errMsg={fieldErrors.level} options={levelOptions} />
        </div>

        {level === "OrgHead" && (
          <div className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 py-3 text-xs text-violet-100">
            این فرد به‌عنوان «سرپرست سازمان» در همین سازمان ثبت می‌شود.
          </div>
        )}
        {needsUnit && (
          <div className="max-w-md">
            <OrgSelect
              label={level === "UnitHead" ? "واحد (نقش سرپرست واحد)" : "واحد (نقش مامور — اختیاری)"}
              value={unitId}
              onChange={setUnitId}
              errMsg={fieldErrors.unit_id}
              options={unitOptions}
              placeholder={level === "UnitHead" ? "انتخاب واحد" : "بدون انتصاب به واحد"}
            />
          </div>
        )}

        {formError && <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{formError}</p>}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button variant="neutral" onClick={() => router.push(`/org/${orgId}/people`)}>انصراف</Button>
          <Button onClick={() => void handleSubmit()} loading={submitting} disabled={submitting}>
            {submitting ? "در حال ثبت..." : "ثبت فرد"}
          </Button>
        </div>
      </div>
    </div>
  );
}
