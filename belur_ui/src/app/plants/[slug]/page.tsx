import DetailPage from "@/components/DetailPage";

export const instant = false;

export default async function PlantDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DetailPage slug={slug} kind="plant" />;
}
