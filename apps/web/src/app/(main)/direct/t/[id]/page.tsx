import { ChatWindow } from "@/features/direct/components/chat-window";

/** /direct/t/[id] — chat (Spec 08) */
export default async function ThreadPage({ params }: PageProps<"/direct/t/[id]">) {
  const { id } = await params;
  const chatId = Number(id);
  if (!Number.isInteger(chatId) || chatId <= 0) {
    return <p className="m-auto text-sm text-ig-text-secondary">Chat not found.</p>;
  }
  return <ChatWindow key={chatId} chatId={chatId} />;
}
