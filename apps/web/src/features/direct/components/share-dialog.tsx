"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Link2, Search, X } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { usePeopleSearch } from "@/features/search/hooks";
import { sharePost } from "@/features/social/api";
import { mediaUrl } from "@/lib/media";
import { createChat, sendMessage } from "../api";
import { directKeys, peerOf, useChats, useMe } from "../hooks";

/** Chi share meshavad: post (reel ham) yo story */
export type ShareTarget = { postId?: number; storyId?: number } | null;

type Target = { key: string; label: string; sub?: string; image: string | null; chatId?: number; userId?: string };

/**
 * "Share" misli Instagram: tor-i avatar-ho, intixobi chand nafar (nishoni kabud),
 * "Write a message...", "Send" / "Send separately" — ba har kas paymi alohida.
 * Chat-hoi mavjud (Suggested) yo justujui user (TanStack Query, kesh-i umumi bo Search).
 */
export function ShareDialog({ share, onClose }: { share: ShareTarget; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: chats } = useChats();
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Target[]>([]);
  const [sending, setSending] = useState(false);
  const search = usePeopleSearch(q);

  const fromChats: Target[] = (chats ?? []).map((c) => {
    const peer = peerOf(c, me?.userId);
    return c.isGroup
      ? { key: `c${c.chatId}`, chatId: c.chatId, label: peer.userName, image: peer.image }
      : { key: `u${peer.id}`, chatId: c.chatId, userId: peer.id ?? undefined, label: peer.userName, image: peer.image };
  });
  const fromSearch: Target[] = (search.data ?? [])
    .filter((u) => u.id !== me?.userId)
    .map((u) => ({ key: `u${u.id}`, userId: u.id, label: u.userName, sub: u.fullName ?? undefined, image: u.avatar }));
  const list = search.term ? fromSearch : fromChats;
  const isPicked = (t: Target) => picked.some((p) => p.key === t.key);
  const toggle = (t: Target) => setPicked((p) => (p.some((x) => x.key === t.key) ? p.filter((x) => x.key !== t.key) : [...p, t]));

  const reset = () => {
    setPicked([]);
    setQ("");
    setNote("");
    onClose();
  };

  const link = () => {
    if (!share) return "";
    return share.postId ? `${window.location.origin}/p/${share.postId}` : window.location.href;
  };

  const send = async () => {
    if (!share || !picked.length) return;
    setSending(true);
    const text = note.trim();
    // Har giranda alohida: agar yake xato dihad, digaron baroyash monda nameshavand
    const results = await Promise.allSettled(
      picked.map(async (t) => {
        const chatId = t.chatId ?? (await createChat(t.userId!));
        await sharePost(chatId, share.postId ?? 0, share.storyId);
        if (text) await sendMessage(chatId, text);
      }),
    );
    setSending(false);
    void qc.invalidateQueries({ queryKey: directKeys.chats });
    const failed = picked.filter((_, i) => results[i]!.status === "rejected");
    if (!failed.length) {
      toast(picked.length > 1 ? `Sent to ${picked.length} people` : "Sent");
      reset();
      return;
    }
    // Faqat ononro, ki naraftand, intixobshuda memonem — "Send"-i duyum takror namefiristad
    setPicked(failed);
    toast.error(`Couldn't send to ${failed.map((f) => f.label).join(", ")}`);
  };

  return (
    <Dialog open={!!share} onOpenChange={(o) => !o && !sending && reset()}>
      <DialogContent showClose={false} className="flex h-[min(640px,85dvh)] w-[min(548px,calc(100vw-32px))] max-w-none flex-col overflow-hidden rounded-xl bg-ig-bg-elevated p-0">
        <header className="relative flex h-[52px] shrink-0 items-center justify-center border-b border-ig-elevated-separator">
          <DialogTitle>Share</DialogTitle>
          <DialogDescription className="sr-only">Send to one or more people</DialogDescription>
          <button type="button" aria-label="Close" onClick={reset} className="absolute right-3 rounded-full p-1 text-ig-icon hover:bg-ig-hover-overlay">
            <X className="size-6" />
          </button>
        </header>

        <label className="mx-4 my-3 flex shrink-0 items-center gap-2 rounded-lg bg-ig-bg-secondary px-3">
          <Search aria-hidden className="size-4 text-ig-text-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search people"
            placeholder="Search"
            className="h-9 flex-1 bg-transparent text-sm text-ig-input-text outline-none placeholder:text-ig-input-placeholder"
          />
          {search.isSearching && search.term ? <Spinner size={16} /> : null}
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {list.length ? (
            <ul className="grid grid-cols-3 gap-y-2 sm:grid-cols-4">
              {list.map((t) => {
                const on = isPicked(t);
                return (
                  <li key={t.key}>
                    <button
                      type="button"
                      aria-label={`Share with ${t.label}`}
                      aria-pressed={on}
                      onClick={() => toggle(t)}
                      className="flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-2 hover:bg-ig-hover-overlay"
                    >
                      <span className="relative">
                        <Avatar src={mediaUrl(t.image)} alt={t.label} size={56} />
                        {on ? (
                          <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-ig-bg-elevated bg-ig-primary text-ig-text-on-color">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        ) : null}
                      </span>
                      <span className="w-full truncate text-center text-xs text-ig-text">{t.label}</span>
                      {t.sub ? <span className="-mt-1 w-full truncate text-center text-xs text-ig-text-secondary">{t.sub}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : search.term && !search.isSearching ? (
            search.isError ? (
              <p role="alert" className="px-4 py-6 text-center text-sm text-ig-text-secondary">
                Couldn&apos;t load people.{" "}
                <button type="button" onClick={() => void search.refetch()} className="font-semibold text-ig-link-action">
                  Try again
                </button>
              </p>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-ig-text-secondary">No account found.</p>
            )
          ) : !search.term ? (
            <p className="px-4 py-6 text-center text-sm text-ig-text-secondary">Search for people to share with.</p>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-ig-elevated-separator">
          {picked.length ? (
            <div className="p-4">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="Message"
                placeholder="Write a message..."
                maxLength={1000}
                className="mb-3 w-full bg-transparent py-1 text-sm text-ig-input-text outline-none placeholder:text-ig-input-placeholder"
              />
              <button
                type="button"
                disabled={sending}
                onClick={() => void send()}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-ig-primary text-sm font-semibold text-ig-text-on-color hover:bg-ig-primary-hover active:bg-ig-primary-pressed disabled:bg-ig-primary-disabled"
              >
                {sending ? <Spinner size={16} /> : picked.length > 1 ? "Send separately" : "Send"}
              </button>
            </div>
          ) : (
            <div className="flex justify-center p-3">
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(link())
                    .then(() => toast("Link copied"))
                    .catch(() => toast.error("Couldn't copy link"))
                }
                className="flex flex-col items-center gap-1.5 text-xs text-ig-text"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-ig-bg-secondary">
                  <Link2 className="size-6" />
                </span>
                Copy link
              </button>
            </div>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
