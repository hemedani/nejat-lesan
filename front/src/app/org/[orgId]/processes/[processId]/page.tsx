import { ProcessBuilder } from "@/components/org/ProcessBuilder";

export default async function OrgProcessDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; processId: string }>;
}) {
  const { orgId, processId } = await params;
  return <ProcessBuilder orgId={orgId} processId={processId} />;
}
