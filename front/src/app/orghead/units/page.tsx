"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { UnitListView } from "@/components/org/UnitListView";

export default function OrgHeadUnitsPage() {
  return <ScopedView>{({ orgId }) => <UnitListView orgId={orgId} />}</ScopedView>;
}
