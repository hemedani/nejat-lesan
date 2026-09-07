"use client";

import { useEffect, useState } from "react";
import { getOrganization } from "@/app/actions/organization/getOrganization";
import { gets as getAccidents } from "@/app/actions/accident/gets";
import { unwrapApiResponse } from "@/utils/api-response";
import type { OrganizationListItem } from "@/services/org-projections";
import type { PatrolReport } from "@/types/patrol";
import { INCIDENT_TYPE_LABELS, INCIDENT_TYPE_ORDER } from "@/utils/org";
import { PanelCard, PageSkeleton } from "@/components/patrol/ui";

interface IncidentSummary {
  total: number;
  byType: Record<string, number>;
  open: number;
  completed: number;
}

export function OrgAnalyticsPanel({ orgId }: { orgId: string }) {
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const organization = unwrapApiResponse<OrganizationListItem>(
          await getOrganization({ set: { _id: orgId } }),
        );
        const roadId = organization.road?._id;
        let records: PatrolReport[] = [];
        if (roadId) {
          const data = unwrapApiResponse<PatrolReport[]>(
            await getAccidents({
              set: { page: 1, limit: 500, road: [roadId] },
              get: { _id: 1, incident_type: 1, review_status: 1, review_reason: 1 },
            }),
          );
          records = Array.isArray(data) ? data : [];
        }
        if (!alive) return;
        const byType: Record<string, number> = {};
        let open = 0;
        let completed = 0;
        for (const record of records) {
          const type = record.incident_type || "other";
          byType[type] = (byType[type] || 0) + 1;
          const status = record.review_status;
          if (status === "submitted" || status === "under_review" || status === "returned") open += 1;
          if (status === "approved" || status === "completed") completed += 1;
        }
        setSummary({ total: records.length, byType, open, completed });
      } catch {
        if (alive) setSummary(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orgId]);

  if (loading) return <PanelCard className="mt-5"><PageSkeleton blocks={[100]} /></PanelCard>;
  if (!summary) return null;

  return (
    <PanelCard title="نمای تحلیلی رخدادها" className="mt-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="کل رخدادها" value={summary.total.toLocaleString("fa-IR")} />
        <Metric label="در انتظار بررسی" value={summary.open.toLocaleString("fa-IR")} />
        <Metric label="تأیید/تکمیل‌شده" value={summary.completed.toLocaleString("fa-IR")} />
        <Metric label="انواع" value={Object.keys(summary.byType).length.toLocaleString("fa-IR")} />
      </div>
      {INCIDENT_TYPE_ORDER.some((type) => summary.byType[type]) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {INCIDENT_TYPE_ORDER.map((type) => {
            const count = summary.byType[type] || 0;
            if (!count) return null;
            const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
            return (
              <span key={type} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-slate-200">
                {INCIDENT_TYPE_LABELS[type]} · {count.toLocaleString("fa-IR")} ({pct.toLocaleString("fa-IR")}٪)
              </span>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[.02] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
