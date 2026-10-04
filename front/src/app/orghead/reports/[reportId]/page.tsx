"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";
import { orgRoutes } from "@/utils/org-routes";

export default function OrgHeadReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = params?.reportId;

  return (
    <ScopedView>
      {() => (
        <OrgIncidentDetailView reportId={String(reportId)} backHref={orgRoutes.reports()} />
      )}
    </ScopedView>
  );
}