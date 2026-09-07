import { PatrolWorkspace } from "@/components/patrol/PatrolWorkspace";
import { ModuleGate } from "@/components/system/ModuleGate";

export default function PatrolLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate module="incident_patrol">
      <PatrolWorkspace>{children}</PatrolWorkspace>
    </ModuleGate>
  );
}
