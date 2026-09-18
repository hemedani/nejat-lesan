import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { PanelShell } from "@/components/system/PanelShell";

export default function PatrolManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard panel="patrol-manager">
      <PanelScopeProvider prefer="organization">
        <PanelShell panel="patrol-manager" scopeKind="organization">
          {children}
        </PanelShell>
      </PanelScopeProvider>
    </PanelGuard>
  );
}
