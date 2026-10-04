"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
 * No `authReady` gate here on purpose: `getDefaultPanel` is pure, and the
 * destination's own `PanelGuard` settles an unauthenticated visitor. Gating here
 * too would only add a second redirect.
 */
export default function OrgForwardPage() {
  const viewer = usePanelViewer();
  const router = useRouter();
  const target = getDefaultPanel(viewer);

  useEffect(() => {
    router.replace(target);
  }, [target, router]);

  return <PageSkeleton blocks={[220, 260]} />;
}