import { OrgScopeGuard } from "@/components/org/OrgScopeGuard";

export default async function OrgIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgScopeGuard orgId={orgId}>{children}</OrgScopeGuard>;
}
