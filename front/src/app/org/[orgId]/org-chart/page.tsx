import { OrgChartView } from "@/components/org/OrgChartView";

export default async function OrgChartPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <OrgChartView orgId={orgId} />;
}
