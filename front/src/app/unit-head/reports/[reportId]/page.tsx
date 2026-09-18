"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";

export default function UnitHeadReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = params?.reportId;

  return (
    <ScopedView require="unit">
      {({ orgId }) => (
        <OrgIncidentDetailView
          orgId={orgId}
          reportId={String(reportId)}
          backHref="/unit-head/reports"
        />
      )}
    </ScopedView>
  );
}
