"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { PeopleListView } from "@/components/org/PeopleListView";

export default function OrgHeadPeoplePage() {
  return <ScopedView>{({ orgId }) => <PeopleListView orgId={orgId} />}</ScopedView>;
}
