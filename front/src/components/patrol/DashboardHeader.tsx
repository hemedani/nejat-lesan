"use client";

import { Button } from "@/components/atoms/Button";

export function DashboardHeader({
  title,
  description,
  onRefresh,
  loading,
}: {
  title: string;
  description: string;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm text-blue-300">داشبورد عملیاتی</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      <Button variant="secondary" onClick={onRefresh} disabled={loading} loading={loading}>
        {loading ? "در حال تازه‌سازی..." : "تازه‌سازی"}
      </Button>
    </div>
  );
}
