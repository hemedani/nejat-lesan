import { OrgDashboardView } from "@/components/org/OrgDashboardView";

export default async function OrgIdPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <OrgDashboardView orgId={orgId} />;
}
