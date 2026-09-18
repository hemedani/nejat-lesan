"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { WarehouseWorkspace } from "@/components/warehouse/WarehouseWorkspace";

export default function EmployeeWarehousePage() {
  return (
    <ScopedView require="unit">
      {({ orgId, unitId }) => (
        <WarehouseWorkspace mode="employee" orgId={orgId} unitId={unitId as string} />
      )}
    </ScopedView>
  );
}
