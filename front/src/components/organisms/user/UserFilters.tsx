"use client";

import { useRouter, useSearchParams } from "next/navigation";

const levels = [
  ["", "همه کاربران"],
  ["Patrol", "مأموران گشت"],
  ["Manager", "مدیران"],
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
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><label className="text-sm font-medium text-slate-400" htmlFor="user-level-filter">فیلتر سطح دسترسی</label><select id="user-level-filter" value={active} onChange={(event) => update(event.target.value)} className="min-w-52 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10">{levels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>;
}
