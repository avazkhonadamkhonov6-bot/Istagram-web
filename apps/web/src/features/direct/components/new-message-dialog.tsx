"use client";

import type { UserListItem } from "@repo/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { createChat, createGroup, searchUsers } from "../api";
import { directKeys, useMe } from "../hooks";

/** Modali "New message": justujui user → create-chat → /direct/t/[id]; 2+ user → group chat (Spec 14 §4) */
export function NewMessageDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<UserListItem[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  // Debounce 300 ms
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const search = useQuery({ queryKey: ["user-search", term], queryFn: () => searchUsers(term), enabled: term.length > 0 });
  const results = term ? (search.data ?? []).filter((u) => u.id !== me?.userId) : [];
  const loading = term.length > 0 && search.isFetching;

  async function start() {
    if (selected.length === 0) return;
    setCreating(true);
    try {
      const chatId =
        selected.length === 1
          ? await createChat(selected[0]!.id)
          : await createGroup(
              groupName.trim() || selected.map((u) => u.userName).join(", ").slice(0, 50),
              selected.map((u) => u.id),
            );
      await qc.invalidateQueries({ queryKey: directKeys.chats });
      setOpen(false);
      setQ("");
      setSelected([]);
      setGroupName("");
      router.push(`/direct/t/${chatId}`);
    } catch {
      toast.error("Couldn't start chat");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button type="button" aria-label="New message" className="text-ig-icon">
            <SquarePen className="size-6" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-[70vh] max-w-[548px] flex-col p-0">
        <DialogTitle className="border-b border-ig-separator py-3 text-center">New message</DialogTitle>
        {/* Chip-ho berun az <label>, ki nomi accessible-i onho matni input-ro nagirad */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ig-separator px-4 py-2 text-sm">
          <label htmlFor="new-message-to" className="mr-2 font-semibold">
            To:
          </label>
          {selected.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected((cur) => cur.filter((x) => x.id !== u.id))}
              className="rounded-full bg-ig-bg-highlight px-3 py-1 text-sm font-semibold text-ig-primary"
            >
              <span aria-hidden>{u.userName} ×</span>
              <span className="sr-only">Remove {u.userName}</span>
            </button>
          ))}
          <input
            id="new-message-to"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="min-w-[120px] flex-1 bg-transparent py-1 outline-none placeholder:text-ig-input-placeholder"
          />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loading && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
          {!loading && q && results.length === 0 && <p className="px-4 text-sm text-ig-text-secondary">No account found.</p>}
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() =>
                setSelected((cur) => (cur.some((x) => x.id === u.id) ? cur.filter((x) => x.id !== u.id) : [...cur, u]))
              }
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-ig-hover-overlay",
                selected.some((x) => x.id === u.id) && "bg-ig-bg-highlight",
              )}
            >
              <Avatar src={mediaUrl(u.avatar)} alt={u.userName} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{u.userName}</span>
                <span className="block truncate text-sm text-ig-text-secondary">{u.fullName}</span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "size-6 rounded-full border-2 border-ig-stroke",
                  selected.some((x) => x.id === u.id) && "border-ig-primary bg-ig-primary",
                )}
              />
            </button>
          ))}
        </div>
        <div className="space-y-3 p-4">
          {selected.length > 1 && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (optional)"
              maxLength={50}
              className="w-full rounded-lg border border-ig-stroke bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ig-input-placeholder"
            />
          )}
          <Button className="w-full" disabled={selected.length === 0 || creating} onClick={start}>
            Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
