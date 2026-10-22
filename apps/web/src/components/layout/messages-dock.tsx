"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, Send, X } from "lucide-react";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { peerOf, useChats, useDirectUnreadCount } from "@/features/direct/hooks";
import { useMe } from "@/features/auth/hooks";
import { mediaUrl } from "@/lib/media";

function DockChats() {
  const { data: chats, isPending, isError, refetch } = useChats();
  const { data: me } = useMe();
  if (isPending) return <p className="p-6 text-ig-text-secondary" role="status">Loading messages…</p>;
  if (isError) return <div className="p-6"><p>Could not load messages.</p><button onClick={() => void refetch()} className="mt-3 text-ig-link-action">Try again</button></div>;
  if (!chats?.length) return <p className="p-6 text-ig-text-secondary">No messages yet. <Link href="/direct/inbox" className="text-ig-link-action">Start a conversation</Link></p>;
  return <div className="overflow-y-auto">{chats.map(chat => {
    const peer = peerOf(chat, me?.userId);
    return <Link key={chat.chatId} href={`/direct/t/${chat.chatId}`} className="flex items-center gap-3 px-3 py-2 hover:bg-ig-hover-overlay">
      <SmallAvatar src={mediaUrl(peer.image)} name={peer.userName} className="size-14 shrink-0" />
      <div className="min-w-0 flex-1"><p className={chat.unreadCount ? "truncate font-semibold" : "truncate"}>{peer.userName}</p><p className="mt-1 truncate text-ig-text-secondary">{chat.lastMessage?.messageText || (chat.lastMessage ? "Sent an attachment" : "Start a conversation")}</p></div>
      {chat.unreadCount > 0 && <span aria-label={`${chat.unreadCount} unread messages`} className="size-2 shrink-0 rounded-full bg-ig-primary" />}
    </Link>;
  })}</div>;
}

export function MessagesDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: unread } = useDirectUnreadCount();
  if (pathname.startsWith("/direct")) return null;
  return <>
  {/* Telefon va ekrani mayda: tugmai mudavvari Messages, misli Instagram */}
  {pathname === "/" && <Link href="/direct/inbox" aria-label="Open messages" className="ig-messages-fab">
    <Send className="size-6" />
    {!!unread?.count && <span className="ig-unread-count absolute -right-0.5 -top-0.5">{unread.count}</span>}
  </Link>}
  <div className="ig-messages-dock">
    {open ? <section aria-label="Messages preview" className="ig-messages-preview">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ig-separator px-4"><h2 className="font-semibold">Messages</h2>{!!unread?.count && <span className="ig-unread-count">{unread.count}</span>}<Link href="/direct/inbox" aria-label="Open inbox" className="ml-auto p-1"><Maximize2 className="size-4" /></Link><button onClick={() => setOpen(false)} aria-label="Close messages" className="p-1"><X className="size-5" /></button></header>
      <DockChats />
    </section> : <button onClick={() => setOpen(true)} aria-label="Open messages preview" aria-expanded={false} className="ig-messages-pill"><Send className="size-6" /><span>Messages</span>{!!unread?.count && <span className="ig-unread-count">{unread.count}</span>}</button>}
  </div>
  </>;
}
