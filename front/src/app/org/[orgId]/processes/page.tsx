import { ProcessListView } from "@/components/org/ProcessListView";

export default async function OrgProcessesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <ProcessListView orgId={orgId} />;
}
