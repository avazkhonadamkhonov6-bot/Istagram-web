"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorFallback } from "@/components/error-fallback";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { peerOf, useChats, useMe } from "../hooks";
import { NewMessageDialog } from "./new-message-dialog";

/** Sutuni chap-i Direct: 397px dar desktop (Spec 08) */
export function ChatList({ className }: { className?: string }) {
  const { data: me } = useMe();
  const { data: chats, isPending, isError, refetch } = useChats();
  const params = useParams<{ id?: string }>();
  const activeId = params.id ? Number(params.id) : null;

  return (
    <aside className={cn("flex h-full flex-col border-r border-ig-separator", className)}>
      <header className="flex items-center justify-between px-6 pb-3 pt-9">
        <h1 className="text-xl font-bold">{me?.userName ?? " "}</h1>
        <NewMessageDialog />
      </header>
      <h2 className="px-6 pb-2 text-base font-bold">Messages</h2>

      <div className="flex-1 overflow-y-auto">
        {isPending &&
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-2">
              <Skeleton className="size-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}

        {isError && <ErrorFallback compact title="Couldn't load chats" onRetry={() => refetch()} />}

        {chats?.length === 0 && <p className="px-6 py-4 text-sm text-ig-text-secondary">No messages yet.</p>}

        {chats?.map((chat) => {
          const peer = peerOf(chat, me?.userId);
          const last = chat.lastMessage;
          const body =
            last?.messageText ??
            (last?.sharedPost
              ? "Sent a post"
              : last?.story
                ? "Replied to a story"
                : last?.fileType === "audio"
                  ? "Sent a voice message"
                  : "Sent an attachment");
          const author = last?.userId === me?.userId ? "You: " : chat.isGroup && last ? `${last.userName}: ` : "";
          const preview = last ? `${author}${body}` : "Start a conversation";
          // Paymi naxonda — matni gafs va nuqtai kabud, misli Instagram (Spec 13 §4)
          const unread = chat.unreadCount > 0 && activeId !== chat.chatId;
          return (
            <Link
              key={chat.chatId}
              href={`/direct/t/${chat.chatId}`}
              className={cn(
                "flex items-center gap-3 px-6 py-2 hover:bg-ig-hover-overlay",
                activeId === chat.chatId && "bg-ig-bg-highlight",
              )}
            >
              <Avatar src={mediaUrl(peer.image)} alt={peer.userName} size={56} />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", unread && "font-semibold")}>{peer.userName}</p>
                <p className={cn("truncate text-xs", unread ? "font-semibold text-ig-text" : "text-ig-text-secondary")}>
                  {preview}
                  {last && ` · ${formatRelativeTime(last.sendMassageDate)}`}
                </p>
              </div>
              {unread && <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-ig-primary" />}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
