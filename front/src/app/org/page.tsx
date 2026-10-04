"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import { getDefaultPanel } from "@/utils/panels";
import { PageSkeleton } from "@/components/patrol/ui";

/**
 * `/org` — a bookmark-compatible forwarder, nothing more.
 *
 * The org workspace used to live here at `/org/[orgId]/*` with its own sidebar,
 * and twelve shared components hardcoded links back into it. Every drill-down
 * from `/orghead` therefore ejected the user into a second, differently-chromed
 * org UI, and six `/orghead` detail routes were unreachable because their legacy
 * twins were the wired-up ones.
 *
 * That workspace is gone. The single org surface is `/orghead`, scoped from
 * `user.roles[]` by `PanelScopeProvider`.
 *
 * Authentication is checked before computing a destination, rather than letting
 * the destination's own `PanelGuard` do it: `getDefaultPanel` is pure and returns
 * `/admin` for a viewer with no recognised role, so an anonymous visitor would be
 * redirected twice and see a flash of the wrong panel on the way.
 */
export default function OrgForwardPage() {
  const { isAuthenticated, authReady } = useAuth();
  const viewer = usePanelViewer();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    router.replace(isAuthenticated ? getDefaultPanel(viewer) : "/login");
  }, [authReady, isAuthenticated, viewer, router]);

  return <PageSkeleton blocks={[220, 260]} />;
}