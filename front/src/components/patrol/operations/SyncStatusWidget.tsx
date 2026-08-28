"use client";

import { useCallback, useEffect, useState } from "react";
import { getSyncStatus } from "@/app/actions/accident/getSyncStatus";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { Notice } from "@/components/patrol/ui";

type SyncBuckets = {
  draft?: unknown[];
  queued?: unknown[];
  syncing?: unknown[];
  synced?: unknown[];
  rejected?: unknown[];
};

const BUCKETS = [
  { key: "draft", label: "پیش‌نویس", style: "bg-slate-700/60 text-slate-300" },
  { key: "queued", label: "در صف", style: "bg-blue-400/10 text-blue-200" },
  { key: "syncing", label: "در حال همگام‌سازی", style: "bg-cyan-400/10 text-cyan-200" },
  { key: "synced", label: "همگام‌شده", style: "bg-emerald-400/10 text-emerald-200" },
  { key: "rejected", label: "رد‌شده", style: "bg-rose-400/10 text-rose-200" },
] as const;

export function SyncStatusWidget({ userId, className = "" }: { userId?: string; className?: string }) {
  const [buckets, setBuckets] = useState<SyncBuckets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSyncStatus({
        set: userId ? { userId } : {},
        get: { report_id: 1, sync_status: 1, rejection_reason: 1 },
      });
      setBuckets(unwrapApiResponse<SyncBuckets>(response));
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !buckets) return null;
  if (error) return <Notice tone="rose">{error}</Notice>;
  if (!buckets) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {BUCKETS.map((bucket) => (
        <span
          key={bucket.key}
          className={`rounded-xl px-3 py-2 text-xs ${bucket.style}`}
          title={`گزارش‌های ${bucket.label}`}
        >
          {bucket.label}:{" "}
          <span className="font-bold">{(buckets[bucket.key]?.length || 0).toLocaleString("fa-IR")}</span>
        </span>
      ))}
    </div>
  );
}
