"use client";

import type { NoteDto } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { addNote, deleteNote, getNotes } from "@/features/social/api";
import { formatRelativeTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useMe } from "../hooks";

const NOTE_MAX = 60;

/** Bubble-i note bolo-i avatar, misli Instagram */
function Bubble({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "absolute -top-2 left-1/2 z-10 line-clamp-2 w-[84px] -translate-x-1/2 break-words rounded-2xl bg-ig-bg-primary px-2 py-1.5 text-center text-[11px] leading-tight shadow-ig-strong",
        muted && "text-ig-text-secondary",
      )}
    >
      {text}
    </span>
  );
}

/** Notes dar bolo-i inbox-i Direct (Spec 15 §5): note-i man + note-hoi dustoni mutual */
export function NotesTray() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: notes } = useQuery({ queryKey: ["notes"], queryFn: getNotes, refetchInterval: 60_000 });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [closeFriends, setCloseFriends] = useState(false);

  const mine = notes?.find((n) => n.userId === me?.userId);
  const others = notes?.filter((n) => n.userId !== me?.userId) ?? [];

  const save = useMutation({
    mutationFn: () => addNote(text.trim(), closeFriends),
    onSuccess: (note) => {
      qc.setQueryData<NoteDto[]>(["notes"], (old = []) => [note, ...old.filter((n) => n.userId !== note.userId)]);
      setOpen(false);
      setText("");
    },
    onError: () => toast.error("Couldn't share note"),
  });
  const remove = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      qc.setQueryData<NoteDto[]>(["notes"], (old = []) => old.filter((n) => n.userId !== me?.userId));
      setOpen(false);
    },
    onError: () => toast.error("Couldn't delete note"),
  });

  if (!me) return null;

  return (
    <>
      <ul aria-label="Notes" className="flex gap-4 overflow-x-auto px-6 pb-3 pt-6 [scrollbar-width:none]">
        <li className="shrink-0">
          <button type="button" onClick={() => setOpen(true)} className="relative flex w-[84px] flex-col items-center gap-1 pt-6">
            <Bubble text={mine ? mine.text : "Note..."} muted={!mine} />
            <Avatar src={mediaUrl(me.image)} alt="Your note" size={77} />
            <span className="w-full truncate text-xs text-ig-text-secondary">Your note</span>
          </button>
        </li>
        {others.map((n) => (
          <li key={n.id} className="shrink-0">
            <div className="relative flex w-[84px] flex-col items-center gap-1 pt-6" title={`${n.userName} · ${formatRelativeTime(n.createdAt)}`}>
              <Bubble text={n.text} />
              <span className={cn("rounded-full", n.closeFriends && "ring-2 ring-ig-close-friends ring-offset-2 ring-offset-ig-bg-primary")}>
                <Avatar src={mediaUrl(n.userImage)} alt={n.userName} size={77} />
              </span>
              <span className="w-full truncate text-center text-xs text-ig-text-secondary">{n.userName}</span>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] p-0">
          <DialogTitle className="border-b border-ig-separator py-3 text-center">{mine ? "Your note" : "New note"}</DialogTitle>
          <div className="space-y-4 p-4">
            {mine && (
              <p className="rounded-xl bg-ig-bg-secondary p-3 text-sm">
                {mine.text}
                <span className="mt-1 block text-xs text-ig-text-secondary">Shared {formatRelativeTime(mine.createdAt)} ago</span>
              </p>
            )}
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, NOTE_MAX))}
                placeholder="Share a thought..."
                rows={2}
                className="w-full resize-none rounded-xl border border-ig-stroke bg-transparent p-3 text-sm outline-none placeholder:text-ig-input-placeholder"
              />
              <p className="text-right text-xs text-ig-text-secondary">
                {text.length}/{NOTE_MAX}
              </p>
            </div>
            <label className="flex items-center justify-between text-sm">
              Share with close friends only
              <input type="checkbox" checked={closeFriends} onChange={(e) => setCloseFriends(e.target.checked)} className="size-4 accent-ig-close-friends" />
            </label>
            <p className="text-xs text-ig-text-secondary">Shared with followers you follow back. Notes disappear after 24 hours.</p>
            <Button className="w-full" disabled={!text.trim() || save.isPending} onClick={() => save.mutate()}>
              Share
            </Button>
            {mine && (
              <Button variant="destructive" className="w-full" disabled={remove.isPending} onClick={() => remove.mutate()}>
                Delete note
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
