"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";
import { unitHeadRoutes } from "@/utils/unit-head-routes";

export default function UnitHeadReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = params?.reportId;

  return (
    <ScopedView require="unit">
      {() => (
        <OrgIncidentDetailView
          reportId={String(reportId)}
          backHref={unitHeadRoutes.reports()}
        />
      )}
    </ScopedView>
  );
}