"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { OrgChartView } from "@/components/org/OrgChartView";

export default function UnitHeadOrgChartPage() {
  return <ScopedView require="unit">{({ orgId }) => <OrgChartView orgId={orgId} />}</ScopedView>;
}
