import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ChatWindow } from "@/features/direct/components/chat-window";

/** /direct/t/[id] — chat (Spec 08). `params` faqat dar daxili <Suspense> xonda meshavad (Next 16). */
export default function ThreadPage({ params }: PageProps<"/direct/t/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <Thread params={params} />
    </Suspense>
  );
}

async function Thread({ params }: Pick<PageProps<"/direct/t/[id]">, "params">) {
  const { id } = await params;
  const chatId = Number(id);
  if (!Number.isInteger(chatId) || chatId <= 0) {
    return <p className="m-auto text-sm text-ig-text-secondary">Chat not found.</p>;
  }
  return <ChatWindow key={chatId} chatId={chatId} />;
}
