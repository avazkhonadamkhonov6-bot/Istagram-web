"use client";

import type { UserShort } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { mediaUrl } from "@/lib/media";
import { followUser } from "../api";
import { useFollowList, type FollowListKind } from "../hooks";

function Row({ user, isMe }: { user: UserShort; isMe: boolean }) {
  const follow = useMutation({ mutationFn: () => followUser(user.id) });

  return (
    <li className="flex items-center gap-3 py-2">
      <SmallAvatar
        src={mediaUrl(user.avatar)}
        name={user.userName}
        className="size-11"
      />
      <div className="min-w-0 flex-1 text-sm">
        <Link href={`/${user.userName}`} className="block truncate font-semibold">
          {user.userName}
        </Link>
        <span className="block truncate text-ig-text-secondary">
          {user.fullName}
        </span>
      </div>
      {isMe ? null : (
        <Button
          type="button"
          variant={follow.isSuccess ? "secondary" : "primary"}
          disabled={follow.isPending || follow.isSuccess}
          onClick={() => follow.mutate()}
          className="px-4"
        >
          {follow.isSuccess ? "Following" : "Follow"}
        </Button>
      )}
    </li>
  );
}

export function FollowListModal({
  kind,
  userId,
  username,
}: {
  kind: FollowListKind;
  userId: string;
  username: string;
}) {
  const router = useRouter();
  const { data: me } = useMe();
  const { data, isPending } = useFollowList(kind, userId);
  const [query, setQuery] = useState("");

  const close = () => router.replace(`/${username}`);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.replace(`/${username}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, username]);

  const q = query.trim().toLowerCase();
  const items = (data ?? []).filter(
    (u) =>
      !q ||
      u.userName.toLowerCase().includes(q) ||
      (u.fullName ?? "").toLowerCase().includes(q),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--ig-modal-overlay)" }}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={kind === "followers" ? "Followers" : "Following"}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[min(70vh,500px)] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-ig-bg-elevated"
      >
        <header className="flex items-center justify-between border-b border-ig-separator px-4 py-3">
          <h2 className="mx-auto text-base font-semibold">
            {kind === "followers" ? "Followers" : "Following"}
          </h2>
          <button type="button" aria-label="Close" onClick={close}>
            <X className="size-5" />
          </button>
        </header>
        <div className="px-4 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search"
            className="w-full rounded-lg bg-ig-bg-secondary px-3 py-2 text-sm outline-none"
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          {isPending ? <Skeleton className="mt-2 h-10 w-full" /> : null}
          {items.map((u) => (
            <Row key={u.id} user={u} isMe={u.id === me?.userId} />
          ))}
          {!isPending && items.length === 0 ? (
            <li className="py-8 text-center text-sm text-ig-text-secondary">
              No users found.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}