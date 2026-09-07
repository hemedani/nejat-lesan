import { PatrolWorkspace } from "@/components/patrol/PatrolWorkspace";
import { ModuleGate } from "@/components/system/ModuleGate";

export default function PatrolManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate module="incident_patrol">
      <PatrolWorkspace manager>{children}</PatrolWorkspace>
    </ModuleGate>
  );
}
