import OrganizationDetailView from "@/components/org/OrganizationDetailView";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationDetailView organizationId={orgId} />;
}
