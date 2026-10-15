import DetailPage from "@/components/DetailPage";

export const instant = false;

export default async function PotDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DetailPage slug={slug} kind="pot" />;
}
