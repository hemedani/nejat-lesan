import { UnitListView } from "@/components/org/UnitListView";

export default async function OrgUnitsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <UnitListView orgId={orgId} />;
}
