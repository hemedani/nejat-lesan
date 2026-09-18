import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { PanelShell } from "@/components/system/PanelShell";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard panel="employee">
      <PanelScopeProvider prefer="unit">
        <PanelShell panel="employee" scopeKind="unit">
          {children}
        </PanelShell>
      </PanelScopeProvider>
    </PanelGuard>
  );
}
