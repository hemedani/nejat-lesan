"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { UnitHeadDashboard } from "@/components/unithead/UnitHeadDashboard";

export default function UnitHeadHomePage() {
  return (
    <ScopedView require="unit">
      {({ unitId, orgId }) => (
        <UnitHeadDashboard unitId={unitId as string} orgId={orgId} />
      )}
    </ScopedView>
  );
}
