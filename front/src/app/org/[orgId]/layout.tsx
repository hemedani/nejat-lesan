import { OrgWorkspace } from "@/components/org/OrgWorkspace";

/**
 * Manager-facing multi-organization browser.
 *
 * Role panels live at `/orghead`, `/unit-head` and `/employee`; this workspace
 * is kept so Ghost/Manager can inspect any organization from `/admin/org`.
 * Per-org module gating happens inside `OrgWorkspace`.
 */
export default function OrgIdLayout({ children }: { children: React.ReactNode }) {
  return <OrgWorkspace>{children}</OrgWorkspace>;
}
