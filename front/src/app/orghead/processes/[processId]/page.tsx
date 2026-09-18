"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { ProcessBuilder } from "@/components/org/ProcessBuilder";

export default function OrgHeadProcessDetailPage() {
  const params = useParams<{ processId: string }>();
  const processId = params?.processId;

  return (
    <ScopedView>
      {({ orgId }) => <ProcessBuilder orgId={orgId} processId={String(processId)} />}
    </ScopedView>
  );
}
