import { OrgReportsView } from "@/components/org/OrgReportsView";

export default async function OrgReportsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <OrgReportsView orgId={orgId} />;
}
