"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Send } from "lucide-react";
import {
  messageDtoSchema,
  userListItemSchema,
  type UserListItem,
} from "@repo/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { useMe } from "@/features/auth/hooks";
import { createChat } from "@/features/direct/api";
import { api } from "@/lib/api-client";
import { mediaUrl } from "@/lib/media";
import { toast } from "@/components/ui/toast";
export function SharePostDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserListItem | null>(null);
  const { data: me } = useMe();
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const users = useQuery({
    queryKey: ["share-users", query],
    enabled: open,
    queryFn: () =>
      api(`/User/get-users?UserName=${encodeURIComponent(query)}&PageSize=20`, {
        schema: userListItemSchema.array(),
      }),
  });
  const send = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Choose a recipient.");
      const chatId = await createChat(selected.id);
      const form = new FormData();
      form.set("ChatId", String(chatId));
      form.set("SharedPostId", String(postId));
      return api("/Chat/send-message", {
        method: "PUT",
        body: form,
        schema: messageDtoSchema,
      });
    },
    onSuccess: () => {
      toast("Post sent");
      onOpenChange(false);
      setSelected(null);
    },
    onError: () => toast.error("Could not send. Try again."),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <header className="border-b border-ig-separator p-4 text-center">
          <DialogTitle>Share</DialogTitle>
          <DialogDescription className="sr-only">
            Send this post to a friend or copy its link.
          </DialogDescription>
        </header>
        <div className="p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search recipients"
            placeholder="Search people…"
            className="w-full rounded-lg bg-ig-bg-secondary px-4 py-3 outline-none"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto px-4">
          {users.data
            ?.filter((u) => u.id !== me?.userId)
            .map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => setSelected(u)}
                  aria-pressed={selected?.id === u.id}
                  className={`flex w-full items-center gap-3 rounded-lg p-2 text-left ${selected?.id === u.id ? "bg-ig-bg-highlight" : "hover:bg-ig-hover-overlay"}`}
                >
                  <SmallAvatar
                    src={mediaUrl(u.avatar)}
                    name={u.userName}
                    className="size-11"
                  />
                  <span className="flex-1">
                    <span className="block font-semibold">{u.userName}</span>
                    <span className="text-ig-text-secondary">{u.fullName}</span>
                  </span>
                  <span
                    className={`size-5 rounded-full border ${selected?.id === u.id ? "border-ig-primary bg-ig-primary" : "border-ig-stroke"}`}
                  />
                </button>
              </li>
            ))}
        </ul>
        {users.isError && (
          <p role="alert" className="px-4 text-ig-error">
            Could not load people.{" "}
            <button onClick={() => void users.refetch()}>Try again</button>
          </p>
        )}
        <footer className="flex gap-3 border-t border-ig-separator p-4">
          <Button
            variant="secondary"
            onClick={() => {
              void navigator.clipboard
                .writeText(`${window.location.origin}/p/${postId}`)
                .then(() => toast("Link copied"))
                .catch(() => toast.error("Could not copy link."));
            }}
          >
            <Copy className="size-4" />
            Copy link
          </Button>
          <Button
            className="flex-1"
            disabled={!selected || send.isPending}
            onClick={() => send.mutate()}
          >
            <Send className="size-4" />
            Send
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
