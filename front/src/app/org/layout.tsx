import { OrgWorkspace } from "@/components/org/OrgWorkspace";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <OrgWorkspace>{children}</OrgWorkspace>;
}
