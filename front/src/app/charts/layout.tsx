import { AuthGate } from "@/components/system/AuthGate";
import { ModuleGate } from "@/components/system/ModuleGate";

/**
 * Charts require authentication, then the `charts` module.
 *
 * The order matters, and both gates are needed: `ModuleGate` alone cannot be the
 * only gate, because `AuthContext.hasModule` returns `true` while the module feed
 * is unknown — the state an anonymous visitor is in.
 */
export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ModuleGate module="charts">{children}</ModuleGate>
    </AuthGate>
  );
}