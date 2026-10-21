import { Suspense } from "react";
import { TagView } from "@/features/explore/components/tag-view";

async function Content({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return <TagView tag={decodeURIComponent(tag).toLowerCase()} />;
}

export default function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}