"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { AnnouncementsView } from "@/components/employee/AnnouncementsView";

export default function EmployeeAnnouncementsPage() {
  return <ScopedView require="unit">{() => <AnnouncementsView />}</ScopedView>;
}
