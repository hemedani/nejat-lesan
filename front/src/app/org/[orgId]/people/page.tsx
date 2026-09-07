import { PeopleListView } from "@/components/org/PeopleListView";

export default async function OrgPeoplePage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <PeopleListView orgId={orgId} />;
}
