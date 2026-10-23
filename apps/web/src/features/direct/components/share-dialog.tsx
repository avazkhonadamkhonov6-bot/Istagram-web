"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { sharePost } from "@/features/social/api";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { createChat, searchUsers } from "../api";
import { directKeys, peerOf, useChats, useMe } from "../hooks";

/** Chi share meshavad: post yo story */
export type ShareTarget = { postId?: number; storyId?: number } | null;

type Target = { key: string; label: string; image: string | null; chatId?: number; userId?: string };

/**
 * "Share": post yo story ba Direct — chat-hoi mavjud yo justujui user (Spec 13 §4, Spec 14 §3).
 * Baroi Abubakr: `<ShareDialog share={{ postId }} onClose={...} />` az tugmai Share dar PostCard / Story viewer.
 */
export function ShareDialog({ share, onClose }: { share: ShareTarget; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: chats } = useChats();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [picked, setPicked] = useState<Record<string, Target>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const search = useQuery({ queryKey: ["user-search", term], queryFn: () => searchUsers(term), enabled: term.length > 0 });

  const fromChats: Target[] = (chats ?? []).map((c) => {
    const peer = peerOf(c, me?.userId);
    return { key: `c${c.chatId}`, chatId: c.chatId, label: c.isGroup ? (c.title ?? "Group") : peer.userName, image: c.isGroup ? null : peer.image };
  });
  const fromSearch: Target[] = (search.data ?? [])
    .filter((u) => u.id !== me?.userId)
    .map((u) => ({ key: `u${u.id}`, userId: u.id, label: u.userName, image: u.avatar }));
  const list = term ? fromSearch : fromChats;

  const reset = () => {
    setPicked({});
    setQ("");
    onClose();
  };

  const send = async () => {
    if (!share) return;
    setSending(true);
    try {
      for (const t of Object.values(picked)) {
        const chatId = t.chatId ?? (await createChat(t.userId!));
        await sharePost(chatId, share.postId ?? 0, share.storyId);
      }
      void qc.invalidateQueries({ queryKey: directKeys.chats });
      toast("Sent");
      reset();
    } catch {
      toast.error("Couldn't send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={!!share} onOpenChange={(o) => !o && reset()}>
      <DialogContent className="flex h-[70vh] max-w-[548px] flex-col p-0">
        <DialogTitle className="border-b border-ig-separator py-3 text-center">Share</DialogTitle>
        <label className="flex items-center gap-4 border-b border-ig-separator px-4 py-2 text-sm">
          <span className="font-semibold">To:</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent py-1 outline-none" />
        </label>
        <div className="flex-1 overflow-y-auto py-2">
          {!term ? <p className="px-4 pb-1 text-sm font-semibold">Suggested</p> : null}
          {list.map((t) => (
            <button
              key={t.key}
              aria-label={`Share with ${t.label}`}
              type="button"
              onClick={() => setPicked((p) => (p[t.key] ? Object.fromEntries(Object.entries(p).filter(([k]) => k !== t.key)) : { ...p, [t.key]: t }))}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-ig-hover-overlay"
            >
              <Avatar src={mediaUrl(t.image)} alt={t.label} size={44} />
              <span className="flex-1 truncate text-sm font-semibold">{t.label}</span>
              <span aria-hidden className={cn("size-6 rounded-full border-2 border-ig-stroke", picked[t.key] && "border-ig-primary bg-ig-primary")} />
            </button>
          ))}
          {term && !search.isFetching && list.length === 0 ? <p className="px-4 text-sm text-ig-text-secondary">No account found.</p> : null}
        </div>
        <div className="p-4">
          <Button className="w-full" disabled={!Object.keys(picked).length || sending} onClick={() => void send()}>
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
