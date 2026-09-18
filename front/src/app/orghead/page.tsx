"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { OrgDashboardView } from "@/components/org/OrgDashboardView";

export default function OrgHeadDashboardPage() {
  return <ScopedView>{({ orgId }) => <OrgDashboardView orgId={orgId} />}</ScopedView>;
}
