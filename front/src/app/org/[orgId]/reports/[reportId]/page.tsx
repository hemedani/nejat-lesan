import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";

export default async function OrgReportDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; reportId: string }>;
}) {
  const { orgId, reportId } = await params;
  return <OrgIncidentDetailView orgId={orgId} reportId={reportId} />;
}
