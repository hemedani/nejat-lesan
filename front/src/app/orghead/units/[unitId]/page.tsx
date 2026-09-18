"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { UnitDetailView } from "@/components/org/UnitDetailView";

export default function OrgHeadUnitDetailPage() {
  const params = useParams<{ unitId: string }>();
  const unitId = params?.unitId;

  return (
    <ScopedView>
      {({ orgId }) => <UnitDetailView orgId={orgId} unitId={String(unitId)} />}
    </ScopedView>
  );
}
