"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { UnitMembersView } from "@/components/unithead/UnitMembersView";

export default function UnitHeadMembersPage() {
  return (
    <ScopedView require="unit">
      {({ unitId }) => <UnitMembersView unitId={unitId as string} />}
    </ScopedView>
  );
}
