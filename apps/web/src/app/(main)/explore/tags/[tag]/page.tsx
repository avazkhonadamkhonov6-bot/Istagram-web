import type { Metadata } from "next";
import { Suspense } from "react";
import { TagView } from "@/features/explore/components/tag-view";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  return { title: { absolute: `#${decodeURIComponent(tag)} hashtag on Instagram` } };
}

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