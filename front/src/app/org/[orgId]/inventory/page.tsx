import { InventoryClient } from "@/components/org/inventory/InventoryClient";

export default async function OrgInventoryPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <InventoryClient orgId={orgId} />;
}
