"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";

export default function OrgHeadReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = params?.reportId;

  return (
    <ScopedView>
      {({ orgId }) => (
        <OrgIncidentDetailView orgId={orgId} reportId={String(reportId)} />
      )}
    </ScopedView>
  );
}
