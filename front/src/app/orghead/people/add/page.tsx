"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { PeopleAddView } from "@/components/org/PeopleAddView";

export default function OrgHeadPersonCreatePage() {
  return <ScopedView>{({ orgId }) => <PeopleAddView orgId={orgId} />}</ScopedView>;
}
