"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import { canAccessPanel, getDefaultPanel, getPanelById, type PanelId } from "@/utils/panels";

/**
 * Route-level access control for a panel.
 *
 * Sits at the top of every panel layout so a deep link cannot bypass the role
 * rules that the sidebar already applies. An unauthorized viewer is sent to
 * *their own* default panel rather than to a dead end.
 */
export function PanelGuard({
  panel,
  children,
}: {
  panel: PanelId;
  children: React.ReactNode;
}) {
  const { isAuthenticated, authReady } = useAuth();
  const viewer = usePanelViewer();
  const router = useRouter();

  const definition = getPanelById(panel);
  const allowed = Boolean(definition && canAccessPanel(viewer, definition));
  const fallback = getDefaultPanel(viewer);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!allowed) router.replace(fallback);
  }, [authReady, isAuthenticated, allowed, fallback, router]);

  if (!authReady || !isAuthenticated || !allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-400/70 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
