import { UnitDetailView } from "@/components/org/UnitDetailView";

export default async function OrgUnitDetailPage({ params }: { params: Promise<{ orgId: string; unitId: string }> }) {
  const { orgId, unitId } = await params;
  return <UnitDetailView orgId={orgId} unitId={unitId} />;
}
