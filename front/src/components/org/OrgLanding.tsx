"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import { getDefaultPanel, isOrgHeadViewer, isUnitHeadViewer } from "@/utils/panels";
import { PageSkeleton } from "@/components/patrol/ui";

/**
 * Legacy `/org` entry point.
 *
 * Panels are now split per role (`/orghead`, `/unit-head`, `/employee`), so this
 * route only exists to forward anyone who still has the old link. The
 * `/org/[orgId]` routes stay available for Ghost/Manager multi-organization
 * browsing from `/admin/org`.
 */
export function OrgLanding() {
  const { isAuthenticated, authReady } = useAuth();
  const viewer = usePanelViewer();
  const router = useRouter();

  const target = !authReady
    ? null
    : !isAuthenticated
      ? "/login"
      : isOrgHeadViewer(viewer)
        ? "/orghead"
        : isUnitHeadViewer(viewer)
          ? "/unit-head"
          : getDefaultPanel(viewer);

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  return <PageSkeleton blocks={[220, 260]} />;
}
