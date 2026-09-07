import { PeopleAddView } from "@/components/org/PeopleAddView";

export default async function OrgPeopleAddPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <PeopleAddView orgId={orgId} />;
}
