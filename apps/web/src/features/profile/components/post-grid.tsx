"use client";

import type { PostDto } from "@repo/shared";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Play } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { useGridPosts, type GridKind } from "../hooks";

function Thumb({ post }: { post: PostDto }) {
  const file = post.images[0];
  const url = mediaUrl(file);

  return (
    <Link
      href={`/p/${post.postId}`}
      className="relative block aspect-[3/4] bg-ig-bg-secondary"
    >
      {url && isVideoFile(file) ? (
        <video
          src={url}
          muted
          preload="metadata"
          className="size-full object-cover"
        />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={post.title || `Post by ${post.userName}`}
          className="size-full object-cover"
        />
      ) : null}
      {post.isReel ? (
        <Play
          aria-hidden
          fill="currentColor"
          className="absolute right-2 top-2 size-5 text-ig-text-on-media"
        />
      ) : null}
    </Link>
  );
}

export function PostGrid({
  kind,
  userId,
  filter,
}: {
  kind: GridKind;
  userId: string;
  filter?: "posts" | "reels";
}) {
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGridPosts(kind, userId);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    );
  }

  const all = data?.pages.flat() ?? [];
  const items =
    filter === "reels"
      ? all.filter((p) => p.isReel)
      : filter === "posts"
        ? all.filter((p) => !p.isReel)
        : all;

  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ig-text-secondary">
        {kind === "saved"
          ? "No saved posts yet."
          : filter === "reels"
            ? "No reels yet."
            : "No posts yet."}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {items.map((post) => (
          <Thumb key={post.postId} post={post} />
        ))}
      </div>
      <div ref={sentinel} className="h-8" />
    </>
  );
}