"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { UnitCreateView } from "@/components/org/UnitCreateView";

export default function OrgHeadUnitCreatePage() {
  return <ScopedView>{({ orgId }) => <UnitCreateView orgId={orgId} />}</ScopedView>;
}
