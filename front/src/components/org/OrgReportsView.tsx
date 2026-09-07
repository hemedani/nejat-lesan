"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrganization } from "@/app/actions/organization/getOrganization";
import { gets as getAccidents } from "@/app/actions/accident/gets";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { OrganizationListItem } from "@/services/org-projections";
import type { PatrolReport } from "@/types/patrol";
import { INCIDENT_TYPE_LABELS, INCIDENT_TYPE_ORDER } from "@/utils/org";
import { ReportList } from "@/components/patrol/ReportList";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";

type IncidentFilter = "" | (typeof INCIDENT_TYPE_ORDER)[number];

const PROJECTION = {
  _id: 1,
  report_id: 1,
  serial: 1,
  date_of_accident: 1,
  reported_at: 1,
  sync_status: 1,
  review_status: 1,
  review_reason: 1,
  officer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
  patrol_unit: { _id: 1, code: 1, name: 1 },
  vehicle: { _id: 1, plaque_no: 1 },
  type: { _id: 1, name: 1 },
  incident_type: 1,
  incident_payload: 1,
  incident_severity: { _id: 1, name: 1 },
} as const;

export function OrgReportsView({ orgId }: { orgId: string }) {
  const [roadId, setRoadId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [reports, setReports] = useState<PatrolReport[]>([]);
  const [incidentFilter, setIncidentFilter] = useState<IncidentFilter>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 15;

  const loadOrg = useCallback(async () => {
    try {
      const organization = unwrapApiResponse<OrganizationListItem>(await getOrganization({ set: { _id: orgId } }));
      setRoadId(organization.road?._id || null);
      setOrgName(organization.name);
    } catch {
      setRoadId(null);
    }
  }, [orgId]);

  useEffect(() => {
    void loadOrg();
  }, [loadOrg]);

  const load = useCallback(async () => {
    if (!roadId) return;
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<PatrolReport[]>(
        await getAccidents({
          set: {
            page,
            limit: pageSize,
            road: [roadId],
            ...(incidentFilter ? { incidentType: incidentFilter } : {}),
          },
          get: PROJECTION,
        }),
      );
      setReports(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [roadId, page, incidentFilter]);

  useEffect(() => {
    if (roadId !== null) void load();
  }, [load, roadId]);

  const changeIncident = (filter: IncidentFilter) => {
    setIncidentFilter(filter);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">گزارش‌های رخداد</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{orgName ? `گزارش‌های «${orgName}»` : "گزارش‌های رخداد"}</h1>
          <p className="mt-2 text-sm text-slate-500">تمام رخدادهای ثبت‌شده (تصادف، خرابی راه، مانع و...) روی این جاده را با فیلتر نوع ببینید.</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterPill active={incidentFilter === ""} onClick={() => changeIncident("")} label="همه رخدادها" />
        {INCIDENT_TYPE_ORDER.map((type) => (
          <FilterPill key={type} active={incidentFilter === type} onClick={() => changeIncident(type)} label={INCIDENT_TYPE_LABELS[type]} />
        ))}
      </div>

      {roadId === null && !loading ? (
        <EmptyState message="این سازمان به جاده/آزادراهی گره نخورده است؛ گزارش‌های رخداد بر اساس جادهٔ سازمان نمایش داده می‌شوند." />
      ) : loading ? (
        <PageSkeleton blocks={[160, 260]} />
      ) : error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : reports.length === 0 ? (
        <EmptyState message="رخدادی برای این فیلتر یافت نشد." />
      ) : (
        <>
          <ReportList reports={reports} manager detailBase={`/org/${orgId}`} />
          <div className="mt-4 flex items-center justify-between">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              صفحه قبل
            </Button>
            <span className="text-xs text-slate-500">صفحه {page.toLocaleString("fa-IR")}</span>
            <Button variant="secondary" size="sm" disabled={reports.length < pageSize} onClick={() => setPage((p) => p + 1)}>
              صفحه بعد
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function FilterPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active ? "border-blue-400/40 bg-blue-400/10 text-blue-100" : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
