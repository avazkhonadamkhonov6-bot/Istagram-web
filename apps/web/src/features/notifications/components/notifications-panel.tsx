"use client";

import type { NotificationDto } from "@repo/shared";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { acceptRequest, declineRequest } from "@/features/social/api";
import { toast } from "@/components/ui/toast";
import { followUser } from "@/features/profile/api";
import { formatRelativeTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import {
  getNotifications,
  notificationKeys,
  notificationText,
  readAllNotifications,
} from "@/lib/notifications";
import { useUiStore } from "@/store/ui.store";

function group(date: string) {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const time = Date.parse(date);
  if (time >= start) return "Today";
  if (time >= start - 6 * 86400000) return "This week";
  if (time >= new Date(now.getFullYear(), now.getMonth(), 1).getTime())
    return "This month";
  return "Earlier";
}

function NotificationRow({ item }: { item: NotificationDto }) {
  const close = useUiStore((s) => s.closePanel);
  const qc = useQueryClient();
  const request = useMutation({
    mutationFn: (accept: boolean) => accept ? acceptRequest(item.actor.id) : declineRequest(item.actor.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["follow-requests"] });
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => toast.error("Could not update follow request."),
  });
  const follow = useMutation({
    mutationFn: () => followUser(item.actor.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
  return (
    <li className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-ig-hover-overlay">
      <Link href={`/${item.actor.userName}`} onClick={close}>
        <SmallAvatar
          src={mediaUrl(item.actor.avatar)}
          name={item.actor.userName}
          className="size-11"
        />
      </Link>
      <div className="min-w-0 flex-1 text-sm leading-5">
        <Link
          onClick={close}
          href={`/${item.actor.userName}`}
          className="font-semibold"
        >
          {item.actor.userName}
        </Link>{" "}
        {notificationText(item)}{" "}
        <span className="text-ig-text-secondary">
          {formatRelativeTime(Date.parse(item.createdAt))}
        </span>
      </div>
      {item.type === "FOLLOW_REQUEST" ? (
        request.isSuccess ? <span className="text-xs text-ig-text-secondary">{request.variables ? "Confirmed" : "Deleted"}</span> :
        <div className="flex shrink-0 gap-2"><Button size="sm" disabled={request.isPending} onClick={() => request.mutate(true)}>Confirm</Button><Button size="sm" variant="secondary" disabled={request.isPending} onClick={() => request.mutate(false)}>Delete</Button></div>
      ) : item.post ? (
        <Link
          href={`/p/${item.post.postId}`}
          onClick={close}
          aria-label="View post"
          className="size-11 shrink-0 overflow-hidden rounded-md bg-ig-bg-secondary"
        >
          {item.post.image && (
            <SmallAvatar
              src={mediaUrl(item.post.image)}
              name="Post"
              className="size-11 rounded-none"
            />
          )}
        </Link>
      ) : item.type === "FOLLOW" ? (
        <Button
          disabled={
            item.actor.isFollowing || follow.isPending || follow.isSuccess
          }
          onClick={() => follow.mutate()}
          variant={
            item.actor.isFollowing || follow.isSuccess ? "secondary" : "primary"
          }
        >
          {item.actor.isFollowing || follow.isSuccess
            ? "Following"
            : "Follow back"}
        </Button>
      ) : null}
    </li>
  );
}

export function NotificationsPanel() {
  const qc = useQueryClient();
  const list = useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pageNumber < last.totalPage ? last.pageNumber + 1 : undefined,
  });
  useEffect(() => {
    void readAllNotifications()
      .then(() => {
        qc.setQueryData(notificationKeys.unread, { count: 0 });
      })
      .catch(() => undefined);
  }, [qc, list.dataUpdatedAt]);
  if (list.isPending)
    return (
      <div className="space-y-4 px-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  if (list.isError)
    return (
      <div className="px-6">
        <p>Could not load notifications.</p>
        <Button variant="borderless" onClick={() => void list.refetch()}>
          Try again
        </Button>
      </div>
    );
  const items = list.data.pages.flatMap((p) => p.data);
  if (!items.length)
    return (
      <div className="px-6 py-16 text-center">
        <Heart className="mx-auto mb-4 size-12" />
        <h3 className="font-semibold">Activity on your posts</h3>
        <p className="mt-2 text-ig-text-secondary">
          When someone likes or comments on your posts, you’ll see it here.
        </p>
      </div>
    );
  return (
    <>
      {["Today", "This week", "This month", "Earlier"].map((title) => {
        const entries = items.filter((n) => group(n.createdAt) === title);
        return entries.length ? (
          <section key={title} className="border-b border-ig-separator py-4">
            <h3 className="px-6 pb-2 font-semibold">{title}</h3>
            <ul>
              {entries.map((n) => (
                <NotificationRow key={n.id} item={n} />
              ))}
            </ul>
          </section>
        ) : null;
      })}
      {list.hasNextPage && (
        <Button
          variant="borderless"
          className="mx-auto my-4 flex"
          disabled={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          Load more
        </Button>
      )}
    </>
  );
}
