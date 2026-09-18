import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { PanelShell } from "@/components/system/PanelShell";

export default function PatrolLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard panel="patrol">
      <PanelScopeProvider prefer="unit">
        <PanelShell panel="patrol" scopeKind="unit">
          {children}
        </PanelShell>
      </PanelScopeProvider>
    </PanelGuard>
  );
}
