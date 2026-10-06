"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";
import { parseReportSource } from "@/utils/report-routes";
import { unitHeadRoutes } from "@/utils/unit-head-routes";

export default function UnitHeadReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const searchParams = useSearchParams();
  const reportId = params?.reportId;

  const source = parseReportSource(searchParams?.get("source"));

  return (
    <ScopedView require="unit">
      {({ orgId }) => (
        <OrgIncidentDetailView
          reportId={String(reportId)}
          source={source}
          backHref={unitHeadRoutes.reports()}
          organizationId={orgId}
        />
      )}
    </ScopedView>
  );
}