"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { ProcessBuilder } from "@/components/org/ProcessBuilder";

export default function OrgHeadProcessCreatePage() {
  return <ScopedView>{({ orgId }) => <ProcessBuilder orgId={orgId} />}</ScopedView>;
}
