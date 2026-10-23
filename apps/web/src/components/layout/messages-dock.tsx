"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, Send, X } from "lucide-react";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { peerOf, useChats, useDirectRealtime, useDirectUnreadCount } from "@/features/direct/hooks";
import { ChatWindow } from "@/features/direct/components/chat-window";
import { NewMessageDialog } from "@/features/direct/components/new-message-dialog";
import { useMe } from "@/features/auth/hooks";
import { mediaUrl } from "@/lib/media";

function DockRealtime({ chatId }: { chatId: number | null }) {
  useDirectRealtime(chatId);
  return null;
}

function DockChats({ onSelect }: { onSelect: (chatId: number) => void }) {
  const { data: chats, isPending, isError, refetch } = useChats();
  const { data: me } = useMe();
  if (isPending) return <p className="p-6 text-ig-text-secondary" role="status">Loading messages…</p>;
  if (isError) return <div className="p-6"><p>Could not load messages.</p><button onClick={() => void refetch()} className="mt-3 text-ig-link-action">Try again</button></div>;
  if (!chats?.length) return <div className="p-6 text-ig-text-secondary"><p>No messages yet.</p><NewMessageDialog onChatCreated={onSelect} trigger={<button type="button" className="mt-2 text-ig-link-action">Start a conversation</button>} /></div>;
  return <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{chats.map(chat => {
    const peer = peerOf(chat, me?.userId);
    return <button type="button" key={chat.chatId} onClick={() => onSelect(chat.chatId)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-ig-hover-overlay">
      <SmallAvatar src={mediaUrl(peer.image)} name={peer.userName} className="size-14 shrink-0" />
      <div className="min-w-0 flex-1"><p data-no-translate className={chat.unreadCount ? "truncate font-semibold" : "truncate"}>{peer.userName}</p><p data-no-translate={!!chat.lastMessage?.messageText || undefined} className="mt-1 truncate text-sm text-ig-text-secondary">{chat.lastMessage?.messageText || (chat.lastMessage ? "Sent an attachment" : "Start a conversation")}</p></div>
      {chat.unreadCount > 0 && <span aria-label={`${chat.unreadCount} unread messages`} className="size-2 shrink-0 rounded-full bg-ig-primary" />}
    </button>;
  })}</div>;
}

export function MessagesDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const { data: unread } = useDirectUnreadCount();
  const { data: chats } = useChats();
  const { data: me } = useMe();
  // A hidden desktop widget must not mark conversations read on smaller screens.
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1160px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (pathname.startsWith("/direct")) return null;
  // Avatar-hoi se chat-i oxirin dar tugmai "Messages", misli instagram.com
  const faces = (chats ?? []).slice(0, 3).map((chat) => ({ ...peerOf(chat, me?.userId), chatId: chat.chatId }));
  return <>
  <DockRealtime chatId={open && desktop ? chatId : null} />
  {/* Telefon va ekrani mayda: tugmai mudavvari Messages, misli Instagram */}
  {pathname === "/" && <Link href="/direct/inbox" aria-label="Open messages" className="ig-messages-fab">
    <Send className="size-6" />
    {!!unread?.count && <span className="ig-unread-count absolute -right-0.5 -top-0.5">{unread.count}</span>}
  </Link>}
  <div className="ig-messages-dock">
    {open && desktop ? <section aria-label="Messages preview" className="ig-messages-preview">
      {chatId !== null ? <ChatWindow key={chatId} chatId={chatId} dock onBack={() => setChatId(null)} onClose={() => setOpen(false)} /> : <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ig-separator px-4"><h2 className="font-semibold">Messages</h2>{!!unread?.count && <span className="ig-unread-count">{unread.count}</span>}<span className="ml-auto"><NewMessageDialog onChatCreated={setChatId} /></span><Link href="/direct/inbox" aria-label="Open inbox" className="p-1"><Maximize2 className="size-4" /></Link><button onClick={() => setOpen(false)} aria-label="Close messages" className="p-1"><X className="size-5" /></button></header>
      <DockChats onSelect={setChatId} />
      </>}
    </section> : <button onClick={() => setOpen(true)} aria-label="Open messages preview" aria-expanded={false} className="ig-messages-pill"><Send className="size-6" /><span>Messages</span>{!!unread?.count && <span className="ig-unread-count">{unread.count}</span>}{faces.length > 0 && <span aria-hidden className="ml-auto flex -space-x-2.5">{faces.map((f) => <SmallAvatar key={f.chatId} src={mediaUrl(f.image)} name={f.userName} className="size-7 ring-2 ring-ig-bg-elevated" />)}</span>}</button>}
  </div>
  </>;
}
