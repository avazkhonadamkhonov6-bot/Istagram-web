"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

        {isError && (
          <div className="px-6 py-4 text-sm text-ig-text-secondary">
            Ruyxat bor nashud.{" "}
            <button type="button" className="font-semibold text-ig-link" onClick={() => refetch()}>
              Takror
            </button>
          </div>
        )}

        {chats?.length === 0 && <p className="px-6 py-4 text-sm text-ig-text-secondary">Hanuz paym nest.</p>}

        {chats?.map((chat) => {
          const peer = peerOf(chat, me?.userId);
          const last = chat.lastMessage;
          const preview = last ? `${last.userId === me?.userId ? "You: " : ""}${last.messageText ?? "Fayl"}` : "Suhbat sohta shud";
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
                <p className="truncate text-sm">{peer.userName}</p>
                <p className="truncate text-xs text-ig-text-secondary">
                  {preview}
                  {last && ` · ${formatRelativeTime(last.sendMassageDate)}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
