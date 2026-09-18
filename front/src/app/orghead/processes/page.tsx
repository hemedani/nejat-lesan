"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { ProcessListView } from "@/components/org/ProcessListView";

export default function OrgHeadProcessesPage() {
  return <ScopedView>{({ orgId }) => <ProcessListView orgId={orgId} />}</ScopedView>;
}
