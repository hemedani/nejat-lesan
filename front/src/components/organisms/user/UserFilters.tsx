"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SelectBox from "@/components/atoms/Select";

const levels = [
  ["", "همه کاربران"],
  ["Patrol", "مأموران گشت"],
  ["Manager", "مدیران"],
  ["OrgHead", "سرپرستان سازمان"],
  ["UnitHead", "سرپرستان واحد"],
  ["Editor", "ویرایشگران"],
  ["Enterprise", "سازمانی"],
  ["Ghost", "مهمان"],
];

export function UserFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("levels") || "";
  const update = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", "1");
    if (value) next.set("levels", value); else next.delete("levels");
    router.push(`/admin/users?${next.toString()}`);
  };
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><label className="text-sm font-medium text-slate-400" htmlFor="user-level-filter">فیلتر سطح دسترسی</label><SelectBox value={active} onValueChange={update} options={levels.map(([value, label]) => ({ value, label }))} clearable={false} className="min-w-52" /></div>;
}
