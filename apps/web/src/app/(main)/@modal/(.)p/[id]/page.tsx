import { getServerPost } from "@/lib/server-api";
import { Suspense } from "react";
import { PostDetail } from "@/features/posts/components/post-detail";
import { PostModal } from "@/features/posts/components/post-modal";

async function ModalContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialPost = await getServerPost(Number(id));
  return (
    <PostModal>
      <PostDetail postId={Number(id)} initialPost={initialPost} />
    </PostModal>
  );
}

export default function PostModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ModalContent params={params} />
    </Suspense>
  );
}
