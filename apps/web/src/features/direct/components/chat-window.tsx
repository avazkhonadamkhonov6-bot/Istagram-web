"use client";

import { ChevronLeft, ImageIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorFallback } from "@/components/error-fallback";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { deleteChat } from "../api";
import { directKeys, peerOf, useChats, useDeleteMessage, useMe, useMessages, useSendMessage, type UiMessage } from "../hooks";

const GAP_MS = 15 * 60_000;

export function ChatWindow({ chatId }: { chatId: number }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: chats } = useChats();
  const { data: messages, isPending, isError, error, refetch } = useMessages(chatId);
  const send = useSendMessage(chatId);
  const remove = useDeleteMessage(chatId);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = chats?.find((c) => c.chatId === chatId);
  const peer = chat ? peerOf(chat, me?.userId) : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    send.mutate({ text: value });
    setText("");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) send.mutate({ text: "", file });
  }

  async function removeChat() {
    if (!window.confirm("Delete this chat?")) return;
    try {
      await deleteChat(chatId);
      await qc.invalidateQueries({ queryKey: directKeys.chats });
      router.push("/direct/inbox");
    } catch {
      toast.error("Couldn't delete chat");
    }
  }

  const forbidden = error instanceof ApiError && error.status === 403;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex h-[75px] items-center gap-3 border-b border-ig-separator px-4">
        <Link href="/direct/inbox" aria-label="Back" className="text-ig-icon md:hidden">
          <ChevronLeft className="size-7" />
        </Link>
        {peer && (
          <>
            <Avatar src={mediaUrl(peer.image)} alt={peer.userName} size={44} />
            <span className="flex-1 truncate text-base font-semibold">{peer.userName}</span>
            <button type="button" aria-label="Delete chat" onClick={removeChat} className="text-ig-icon hover:text-ig-error">
              <Trash2 className="size-6" />
            </button>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isPending && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {forbidden && <p className="py-8 text-center text-sm text-ig-text-secondary">You don&apos;t have access to this chat.</p>}
        {isError && !forbidden && <ErrorFallback compact title="Couldn't load messages" onRetry={() => refetch()} />}
        {messages && <MessageList messages={messages} myId={me?.userId} onUnsend={(id) => remove.mutate(id)} />}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="m-4 flex items-center gap-3 rounded-full border border-ig-stroke px-4 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          maxLength={1000}
          className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-ig-input-placeholder"
        />
        {text.trim() ? (
          <button type="submit" className="text-sm font-semibold text-ig-link hover:text-ig-link-action">
            Send
          </button>
        ) : (
          <button type="button" aria-label="Send photo or video" onClick={() => fileRef.current?.click()} className="text-ig-icon">
            {send.isPending ? <Spinner /> : <ImageIcon className="size-6" />}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" hidden onChange={onFile} />
      </form>
    </section>
  );
}

function MessageList({ messages, myId, onUnsend }: { messages: UiMessage[]; myId?: string; onUnsend: (id: number) => void }) {
  // Sarlavhai vaqt, agar bayni paymho > 15 daqiqa
  const rows = useMemo(
    () =>
      messages.map((m, i) => {
        const prev = messages[i - 1];
        const showTime = !prev || new Date(m.sendMassageDate).getTime() - new Date(prev.sendMassageDate).getTime() > GAP_MS;
        return { m, showTime };
      }),
    [messages],
  );

  if (messages.length === 0) return <p className="py-8 text-center text-sm text-ig-text-secondary">Say hi to start the conversation.</p>;

  return (
    <ul className="flex flex-col gap-1">
      {rows.map(({ m, showTime }) => {
        const mine = m.userId === myId;
        const file = mediaUrl(m.file);
        return (
          <li key={m.messageId} className="flex flex-col">
            {showTime && (
              <time className="my-3 text-center text-xs text-ig-text-secondary">{formatRelativeTime(m.sendMassageDate)}</time>
            )}
            <div className={cn("group flex items-center gap-2", mine ? "flex-row-reverse" : "flex-row")}>
              <div
                className={cn(
                  "max-w-[70%] overflow-hidden rounded-[22px] text-[15px]",
                  file ? "" : "px-3 py-2",
                  mine
                    ? "ig-bubble-out"
                    : "ig-bubble-in",
                  m.pending && "opacity-60",
                )}
              >
                {file &&
                  (isVideoFile(m.file!) ? (
                    <video src={file} controls className="max-h-80 w-full" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file} alt="" className="max-h-80 w-full object-cover" />
                  ))}
                {m.messageText && <p className={cn("whitespace-pre-wrap break-words", file && "px-3 py-2")}>{m.messageText}</p>}
              </div>
              {mine && !m.pending && (
                <button
                  type="button"
                  onClick={() => onUnsend(m.messageId)}
                  className="invisible text-xs text-ig-text-secondary hover:text-ig-error group-hover:visible"
                >
                  Unsend
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
