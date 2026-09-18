"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { OrgSettingsView } from "@/components/orghead/OrgSettingsView";

export default function OrgHeadSettingsPage() {
  return <ScopedView>{({ orgId }) => <OrgSettingsView orgId={orgId} />}</ScopedView>;
}
