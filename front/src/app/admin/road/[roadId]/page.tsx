import RoadDetailView from "@/components/road/RoadDetailView";

export default async function RoadDetailPage({
  params,
}: {
  params: Promise<{ roadId: string }>;
}) {
  const { roadId } = await params;
  return <RoadDetailView roadId={roadId} />;
}
