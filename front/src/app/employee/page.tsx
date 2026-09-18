"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { EmployeeDashboard } from "@/components/employee/EmployeeDashboard";

export default function EmployeeHomePage() {
  return (
    <ScopedView require="unit">
      {({ unitId, orgId }) => (
        <EmployeeDashboard unitId={unitId as string} orgId={orgId} />
      )}
    </ScopedView>
  );
}
