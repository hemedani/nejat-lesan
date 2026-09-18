import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { PanelShell } from "@/components/system/PanelShell";

export default function OrgHeadLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard panel="orghead">
      <PanelScopeProvider prefer="organization">
        <PanelShell panel="orghead" scopeKind="organization">
          {children}
        </PanelShell>
      </PanelScopeProvider>
    </PanelGuard>
  );
}
