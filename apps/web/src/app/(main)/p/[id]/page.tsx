import type { Metadata } from "next";
import { getServerPost } from "@/lib/server-api";
import { Suspense } from "react";
import { PostDetail } from "@/features/posts/components/post-detail";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export const metadata: Metadata = { title: "Post" };

async function PostContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialPost = await getServerPost(Number(id));
  return <PostDetail postId={Number(id)} initialPost={initialPost} />;
}

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto flex max-w-[935px] justify-center md:p-8">
      <div className="w-full overflow-hidden border-ig-separator md:h-[700px] md:rounded-sm md:border">
        <Suspense fallback={null}>
          <PostContent params={params} />
        </Suspense>
      </div>
    </div>
  );
}
