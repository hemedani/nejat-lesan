import { ProcessBuilder } from "@/components/org/ProcessBuilder";

export default async function OrgProcessNewPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <ProcessBuilder orgId={orgId} />;
}
