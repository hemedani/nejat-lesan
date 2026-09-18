"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { WarehouseWorkspace } from "@/components/warehouse/WarehouseWorkspace";

export default function UnitHeadWarehousePage() {
  return (
    <ScopedView require="unit">
      {({ orgId, unitId }) => (
        <WarehouseWorkspace mode="unit" orgId={orgId} unitId={unitId as string} />
      )}
    </ScopedView>
  );
}
