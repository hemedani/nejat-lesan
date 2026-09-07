import { UnitCreateView } from "@/components/org/UnitCreateView";

export default async function OrgUnitsNewPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <UnitCreateView orgId={orgId} />;
}
