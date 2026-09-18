"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { OrgChartView } from "@/components/org/OrgChartView";

export default function OrgHeadOrgChartPage() {
  return <ScopedView>{({ orgId }) => <OrgChartView orgId={orgId} />}</ScopedView>;
}
