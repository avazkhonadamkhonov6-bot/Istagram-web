"use client";

import type { UserShort } from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { mediaUrl } from "@/lib/media";
import { toast } from "@/components/ui/toast";
import { followUser, unfollowUser } from "../api";
import {
  useFollowList,
  useIsFollowing,
  profileKeys,
  type FollowListKind,
} from "../hooks";

function Row({ user, isMe }: { user: UserShort; isMe: boolean }) {
  const qc = useQueryClient();
  const { data: following } = useIsFollowing(user.id, !isMe);
  const follow = useMutation({
    mutationFn: () => (following ? unfollowUser(user.id) : followUser(user.id)),
    onSuccess: (result) => {
      qc.setQueryData(profileKeys.isFollow(user.id), result.isFollowing);
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Could not update following. Try again."),
  });

  return (
    <li className="flex items-center gap-3 py-2">
      <SmallAvatar
        src={mediaUrl(user.avatar)}
        name={user.userName}
        className="size-11"
      />
      <div className="min-w-0 flex-1 text-sm">
        <Link
          href={`/${user.userName}`}
          className="block truncate font-semibold"
        >
          {user.userName}
        </Link>
        <span className="block truncate text-ig-text-secondary">
          {user.fullName}
        </span>
      </div>
      {isMe ? null : (
        <Button
          type="button"
          variant={following ? "secondary" : "primary"}
          disabled={follow.isPending}
          onClick={() => follow.mutate()}
          className="px-4"
        >
          {following ? "Following" : "Follow"}
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

  const q = query.trim().toLowerCase();
  const items = (data ?? []).filter(
    (u) =>
      !q ||
      u.userName.toLowerCase().includes(q) ||
      (u.fullName ?? "").toLowerCase().includes(q),
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="flex h-[min(70dvh,500px)] flex-col">
        <header className="border-b border-ig-separator px-4 py-3 text-center">
          <DialogTitle>
            {kind === "followers" ? "Followers" : "Following"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search people in this list.
          </DialogDescription>
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
      </DialogContent>
    </Dialog>
  );
}
