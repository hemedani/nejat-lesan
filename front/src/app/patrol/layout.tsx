import { PatrolWorkspace } from "@/components/patrol/PatrolWorkspace";

export default function PatrolLayout({ children }: { children: React.ReactNode }) {
  return <PatrolWorkspace>{children}</PatrolWorkspace>;
}
