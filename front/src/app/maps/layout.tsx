import { AuthGate } from "@/components/system/AuthGate";
import { ModuleGate } from "@/components/system/ModuleGate";

/**
 * Maps are a module surface like charts, and had the same missing auth gate.
 * Both gates, in the same order — see `charts/layout.tsx` for why.
 */
export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ModuleGate module="charts">{children}</ModuleGate>
    </AuthGate>
  );
}