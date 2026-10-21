import { Suspense } from "react";
import { PostDetail } from "@/features/posts/components/post-detail";
import { PostModal } from "@/features/posts/components/post-modal";

async function ModalContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PostModal>
      <PostDetail postId={Number(id)} />
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