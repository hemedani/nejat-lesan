"use client";

import { OrgIndexView } from "@/components/org/OrgIndexView";

/**
 * `/admin/org` — the organization picker.
 *
 * The Ghost/Manager check that used to live here was a duplicate of
 * `PanelGuard panel="admin"`, which every `/admin` route already passes
 * through. `OrgIndexView` is exported from no other surface, so nothing else
 * needs a gate.
 */
export function AdminOrgPanel() {
  return <OrgIndexView />;
}