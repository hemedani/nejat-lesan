"use client";

export function DashboardHeader({ title, description, onRefresh, loading }: { title: string; description: string; onRefresh: () => void; loading: boolean }) {
  return <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-blue-300">داشبورد عملیاتی</p><h1 className="mt-1 text-2xl font-bold text-white">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div><button onClick={onRefresh} disabled={loading} className="self-start rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-400/10 disabled:opacity-50">{loading ? "در حال تازه‌سازی..." : "تازه‌سازی"}</button></div>;
}
