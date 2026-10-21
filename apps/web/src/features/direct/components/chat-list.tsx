"use client";

import { ChevronDown } from "lucide-react";
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
import { NotesTray } from "./notes-tray";

/** Sutuni chap-i Direct: 397px dar desktop (Spec 08) */
export function ChatList({ className }: { className?: string }) {
  const { data: me } = useMe();
  const { data: chats, isPending, isError, refetch } = useChats();
  const params = useParams<{ id?: string }>();
  const activeId = params.id ? Number(params.id) : null;

  return (
    <aside className={cn("flex h-full flex-col border-r border-ig-separator", className)}>
      <header className="flex min-h-[100px] shrink-0 items-center justify-between gap-4 px-6 pb-3 pt-6">
        <h1 className="flex min-w-0 items-center gap-2 text-xl font-bold"><span className="truncate">{me?.userName ?? "Instagram"}</span><ChevronDown aria-hidden className="size-4 shrink-0" /></h1>
        <NewMessageDialog />
      </header>
      <NotesTray />
      <h2 className="px-6 pb-4 pt-3 text-base font-bold">Messages</h2>

      <div className="flex-1 overflow-y-auto">
        {isPending &&
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-2">
              <Skeleton className="size-14 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-32 max-w-full" />
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
                "flex items-center gap-3 px-6 py-3 transition-colors hover:bg-ig-hover-overlay",
                activeId === chat.chatId && "bg-ig-bg-highlight",
              )}
            >
              <span className="relative shrink-0">
                <Avatar src={mediaUrl(peer.image)} alt={peer.userName} size={56} />
                {chat.peerIsOnline && (
                  <span aria-label="Active now" className="absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-ig-bg-primary bg-ig-success" />
                )}
              </span>
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
