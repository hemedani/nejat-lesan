import { ModuleGate } from "@/components/system/ModuleGate";

export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return <ModuleGate module="charts">{children}</ModuleGate>;
}
