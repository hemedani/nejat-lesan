"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";
import { parseReportSource } from "@/utils/report-routes";
import { orgRoutes } from "@/utils/org-routes";

export default function OrgHeadReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const searchParams = useSearchParams();
  const reportId = params?.reportId;

  // Which collection the id belongs to. `parseReportSource` validates the raw
  // value, so a hand-edited or stale `?source=` cannot make this page query a
  // collection the reader did not ask for.
  const source = parseReportSource(searchParams?.get("source"));

  return (
    <ScopedView>
      {({ orgId }) => (
        <OrgIncidentDetailView
          reportId={String(reportId)}
          source={source}
          backHref={orgRoutes.reports()}
          organizationId={orgId}
        />
      )}
    </ScopedView>
  );
}