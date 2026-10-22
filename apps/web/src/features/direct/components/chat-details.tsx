"use client";

import type { ChatDto, UserListItem } from "@repo/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { relationAction } from "@/features/social/api";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { addGroupMembers, deleteChat, leaveGroup, searchUsers, updateGroup } from "../api";
import { directKeys, peerOf } from "../hooks";

/**
 * Paneli "Details" dar Direct (misli tugmai (i) dar Instagram):
 * group — nom, a'zoho, ilovai odam, baromadan; 1:1 — profil, block, hazfi chat.
 */
export function ChatDetails({
  chat,
  myId,
  onClose,
}: {
  chat: ChatDto;
  myId: string | undefined;
  onClose: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const peer = peerOf(chat, myId);
  const [title, setTitle] = useState(chat.title ?? "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<"leave" | "delete" | "block" | null>(null);
  const [busy, setBusy] = useState(false);

  // Nomi gruppa az server tagyir yoft (realtime / refetch) — input navsozi meshavad
  const [syncedTitle, setSyncedTitle] = useState(chat.title);
  if (syncedTitle !== chat.title) {
    setSyncedTitle(chat.title);
    setTitle(chat.title ?? "");
  }

  const refresh = () => qc.invalidateQueries({ queryKey: directKeys.chats });

  async function saveTitle() {
    const value = title.trim();
    if (!value || value === chat.title) return;
    setSavingTitle(true);
    try {
      await updateGroup(chat.chatId, value);
      await refresh();
      toast("Group name changed");
    } catch {
      toast.error("Couldn't change the group name");
    } finally {
      setSavingTitle(false);
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm === "leave") await leaveGroup(chat.chatId);
      else if (confirm === "delete") await deleteChat(chat.chatId);
      else if (peer.id) await relationAction("block", peer.id);
      await refresh();
      if (confirm === "block") {
        toast(`${peer.userName} is blocked`);
        setConfirm(null);
      } else {
        router.push("/direct/inbox");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const rowCls = "flex w-full items-center px-6 py-3 text-left text-sm hover:bg-ig-hover-overlay";

  return (
    <aside
      aria-label="Details"
      className="flex h-full w-full flex-col border-l border-ig-separator bg-ig-bg md:w-[350px] md:shrink-0"
    >
      <header className="flex h-[75px] shrink-0 items-center gap-2 border-b border-ig-separator px-4">
        <button type="button" aria-label="Close details" onClick={onClose} className="p-1 text-ig-icon md:hidden">
          <ChevronLeft className="size-6" />
        </button>
        <h2 className="text-xl font-bold">Details</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        {chat.isGroup && (
          <section className="border-b border-ig-separator px-6 py-4">
            <label htmlFor="group-name" className="text-sm font-semibold">
              Change group name
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="group-name"
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void saveTitle()}
                placeholder="Add a name"
                className="min-w-0 flex-1 rounded-lg border border-ig-input-border bg-transparent px-3 py-2 text-sm outline-none focus:border-ig-input-border-focus"
              />
              <button
                type="button"
                disabled={savingTitle || !title.trim() || title.trim() === chat.title}
                onClick={() => void saveTitle()}
                className="text-sm font-semibold text-ig-borderless hover:text-ig-borderless-hover disabled:text-ig-borderless-disabled"
              >
                {savingTitle ? <Spinner /> : "Change"}
              </button>
            </div>
          </section>
        )}

        <section className="border-b border-ig-separator py-2">
          <div className="flex items-center justify-between px-6 py-2">
            <h3 className="text-base font-bold">{chat.isGroup ? "Members" : "Member"}</h3>
            {chat.isGroup && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 text-sm font-semibold text-ig-borderless hover:text-ig-borderless-hover"
              >
                <UserPlus className="size-4" /> Add people
              </button>
            )}
          </div>
          <ul>
            {(chat.isGroup
              ? chat.members
              : [{ id: peer.id ?? "", userName: peer.userName, fullName: null, avatar: peer.image }]
            ).map((m) => (
              <li key={m.id}>
                <Link href={`/${m.userName}`} className="flex items-center gap-3 px-6 py-2 hover:bg-ig-hover-overlay">
                  <Avatar src={mediaUrl(m.avatar)} alt={m.userName} size={56} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{m.userName}</span>
                    <span className="block truncate text-sm text-ig-text-secondary">
                      {m.id === myId ? "You" : m.fullName ?? ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="py-2">
          {chat.isGroup ? (
            <button type="button" onClick={() => setConfirm("leave")} className={cn(rowCls, "text-ig-error")}>
              Leave chat
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setConfirm("block")} className={cn(rowCls, "text-ig-error")}>
                Block
              </button>
              <button type="button" onClick={() => setConfirm("delete")} className={cn(rowCls, "text-ig-error")}>
                Delete chat
              </button>
            </>
          )}
        </section>
      </div>

      <Dialog open={confirm !== null} onOpenChange={(v) => !v && setConfirm(null)}>
        <DialogContent showClose={false}>
          <DialogTitle className="px-6 pt-6 text-center text-xl">
            {confirm === "leave" ? "Leave chat?" : confirm === "delete" ? "Delete chat?" : `Block ${peer.userName}?`}
          </DialogTitle>
          <p className="px-8 pb-5 pt-2 text-center text-sm text-ig-text-secondary">
            {confirm === "leave"
              ? "You won't get messages from this group unless someone adds you back."
              : confirm === "delete"
                ? "Deleting removes the chat from your inbox."
                : "They won't be able to message you or find your profile."}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runConfirm()}
            className="w-full border-t border-ig-elevated-separator py-3 text-sm font-bold text-ig-error"
          >
            {confirm === "leave" ? "Leave" : confirm === "delete" ? "Delete" : "Block"}
          </button>
          <button
            type="button"
            onClick={() => setConfirm(null)}
            className="w-full border-t border-ig-elevated-separator py-3 text-sm"
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>

      {chat.isGroup && (
        <AddPeopleDialog
          open={adding}
          onOpenChange={setAdding}
          exclude={chat.members.map((m) => m.id)}
          onAdd={async (ids) => {
            await addGroupMembers(chat.chatId, ids);
            await refresh();
          }}
        />
      )}
    </aside>
  );
}

function AddPeopleDialog({
  open,
  onOpenChange,
  exclude,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exclude: string[];
  onAdd: (ids: string[]) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<UserListItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const setOpen = (value: boolean) => {
    if (!value) {
      setQ("");
      setSelected([]);
    }
    onOpenChange(value);
  };

  const search = useQuery({ queryKey: ["user-search", term], queryFn: () => searchUsers(term), enabled: term.length > 0 });
  const results = term ? (search.data ?? []).filter((u) => !exclude.includes(u.id)) : [];

  async function submit() {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await onAdd(selected.map((u) => u.id));
      toast(selected.length === 1 ? "Person added" : "People added");
      setOpen(false);
    } catch {
      toast.error("Couldn't add people");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[min(520px,80dvh)] flex-col">
        <DialogTitle className="border-b border-ig-elevated-separator py-3 text-center">Add people</DialogTitle>
        <div className="flex flex-wrap items-center gap-2 border-b border-ig-elevated-separator px-4 py-2">
          <span className="text-sm font-semibold">To:</span>
          {selected.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected((s) => s.filter((x) => x.id !== u.id))}
              className="rounded-full bg-[rgb(var(--ig-temporary-highlight))] px-3 py-1 text-sm font-semibold text-ig-borderless"
            >
              {u.userName}
            </button>
          ))}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none"
          />
        </div>
        <ul className="flex-1 overflow-y-auto py-2">
          {search.isFetching && (
            <li className="flex justify-center py-4">
              <Spinner />
            </li>
          )}
          {results.map((u) => {
            const on = selected.some((x) => x.id === u.id);
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setSelected((s) => (on ? s.filter((x) => x.id !== u.id) : [...s, u]))}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-ig-hover-overlay"
                >
                  <Avatar src={mediaUrl(u.avatar)} alt={u.userName} size={44} />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-semibold">{u.userName}</span>
                    <span className="block truncate text-ig-text-secondary">{u.fullName ?? ""}</span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "size-6 rounded-full border-2",
                      on ? "border-ig-primary bg-ig-primary" : "border-ig-stroke",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="p-4">
          <button
            type="button"
            disabled={saving || selected.length === 0}
            onClick={() => void submit()}
            className="w-full rounded-lg bg-ig-primary py-2.5 text-sm font-semibold text-ig-text-on-color hover:bg-ig-primary-hover disabled:bg-ig-primary-disabled"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
