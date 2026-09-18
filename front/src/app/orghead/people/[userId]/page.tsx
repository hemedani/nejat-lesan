"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { PeopleDetailView } from "@/components/org/PeopleDetailView";

export default function OrgHeadPersonDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;

  return (
    <ScopedView>
      {({ orgId }) => <PeopleDetailView orgId={orgId} userId={String(userId)} />}
    </ScopedView>
  );
}
