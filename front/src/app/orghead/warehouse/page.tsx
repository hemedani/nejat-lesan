"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { WarehouseWorkspace } from "@/components/warehouse/WarehouseWorkspace";

export default function OrgHeadWarehousePage() {
  return (
    <ScopedView>
      {({ orgId }) => <WarehouseWorkspace mode="oversight" orgId={orgId} />}
    </ScopedView>
  );
}
