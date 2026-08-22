import { PatrolWorkspace } from "@/components/patrol/PatrolWorkspace";

export default function PatrolManagerLayout({ children }: { children: React.ReactNode }) {
  return <PatrolWorkspace manager>{children}</PatrolWorkspace>;
}
