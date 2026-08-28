"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { PanelCard } from "@/components/patrol/ui";
import FormCreatePatrolUser from "@/components/template/FormCreatePatrolUser";

export default function CreatePatrolOfficerPage() {
  const { userLevel } = useAuth();
  if (userLevel !== "Ghost" && userLevel !== "Manager") {
    return (
      <RoleNotice message="ایجاد مأمور گشت فقط برای مدیران در دسترس است." />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">مدیریت عملیات گشت</p>
          <h1 className="mt-1 text-2xl font-bold text-white">ایجاد مأمور گشت جدید</h1>
          <p className="mt-2 text-sm text-slate-500">
            حساب با سطح «مأمور گشت» و دسترسی‌های موبایل ایجاد می‌کند.
          </p>
        </div>
        <Link
          href="/patrol-manager/operations"
          className="self-start rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/10"
        >
          بازگشت به مدیریت عملیات
        </Link>
      </div>

      <PanelCard>
        <FormCreatePatrolUser />
      </PanelCard>
    </div>
  );
}
