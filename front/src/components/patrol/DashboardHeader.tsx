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
        <p className="text-sm text-brand-fg">داشبورد عملیاتی</p>
        <h1 className="mt-1 text-2xl font-bold text-fg">{title}</h1>
        <p className="mt-2 text-sm text-fg-faint">{description}</p>
      </div>
      <Button variant="secondary" onClick={onRefresh} disabled={loading} loading={loading}>
        {loading ? "در حال تازه‌سازی..." : "تازه‌سازی"}
      </Button>
    </div>
  );
}
