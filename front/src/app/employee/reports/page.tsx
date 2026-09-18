"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { MyReportsView } from "@/components/employee/MyReportsView";

export default function EmployeeReportsPage() {
  return (
    <ScopedView require="unit">{() => <MyReportsView />}</ScopedView>
  );
}
