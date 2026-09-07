import { PeopleDetailView } from "@/components/org/PeopleDetailView";

export default async function OrgPeopleDetailPage({ params }: { params: Promise<{ orgId: string; userId: string }> }) {
  const { orgId, userId } = await params;
  return <PeopleDetailView orgId={orgId} userId={userId} />;
}
