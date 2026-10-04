import { AdminSidebar } from "@/components/organisms/SideBar";
import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PanelGuard panel="admin">
      {/*
        `OrgIndexView` calls `usePanelScope().selectOrg()` to hand the chosen
        organization to the org panel, which needs a provider above it.
        No `prefer` prop on purpose: the admin panel spans organizations, so it
        must not bias toward an org or a unit scope.
      */}
      <PanelScopeProvider>
        <div className="admin-shell flex h-[calc(100vh-4rem)] overflow-hidden">
          <AdminSidebar />
          <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6">{children}</div>
        </div>
      </PanelScopeProvider>
    </PanelGuard>
  );
}