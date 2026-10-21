import { Suspense } from "react";
import { PostDetail } from "@/features/posts/components/post-detail";

async function PostContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail postId={Number(id)} />;
}

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto flex max-w-[935px] justify-center p-4 md:p-8">
      <div className="w-full overflow-hidden rounded-sm border border-ig-separator md:h-[700px]">
        <Suspense fallback={null}>
          <PostContent params={params} />
        </Suspense>
      </div>
    </div>
  );
}