"use client";

import { useEffect, useState } from "react";
import { adminRecordRoutes } from "@/utils/admin-record-routes";
import { useRouter } from "next/navigation";

import { get } from "@/app/actions/road/get";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { RoadDetail } from "@/services/road-projections";
import RoadForm from "@/components/road/RoadForm";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export function RoadDetailView({ roadId }: { roadId: string }) {
  const router = useRouter();
  const [road, setRoad] = useState<RoadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = unwrapApiResponse<RoadDetail>(await get(roadId));
        if (cancelled) return;
        if (!data) {
          setError("جاده یافت نشد.");
          return;
        }
        setRoad(data);
      } catch (cause) {
        if (!cancelled) setError(getPatrolErrorMessage(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadId]);

  if (loading) return <PageSkeleton />;
  if (error) return <RetryErrorBox message={error} onRetry={() => router.refresh()} />;

  return (
    <div>
      <button
        className="mb-4 text-sm text-slate-400 hover:text-white"
        onClick={() => router.push(adminRecordRoutes.roads())}
        type="button"
      >
        → بازگشت به فهرست جاده‌ها
      </button>
      <RoadForm road={road} />
    </div>
  );
}

export default RoadDetailView;
