import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { PanelShell } from "@/components/system/PanelShell";

export default function UnitHeadLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard panel="unit-head">
      <PanelScopeProvider prefer="unit">
        <PanelShell panel="unit-head" scopeKind="unit">
          {children}
        </PanelShell>
      </PanelScopeProvider>
    </PanelGuard>
  );
}
