"use client";

import { useAuth } from "@/context/AuthContext";
import type { PanelViewer } from "@/utils/panels";

/**
 * Adapter that turns the auth context into the shape the panel registry and
 * nav config expect. Kept separate from `AuthContext` so the panel layer can
 * evolve without widening the auth surface.
 */
export function usePanelViewer(): PanelViewer {
  const { userLevel, userData, hasModule, orgHasModule } = useAuth();

  return {
    level: userLevel,
    roles: userData?.roles,
    hasModule,
    orgHasModule,
  };
}
