"use client";

import type { PostDto } from "@repo/shared";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Play } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useExploreFeed } from "../hooks";

const ROW_HEIGHT = "calc((100cqw - 0.5rem) / 3)";

// Каждый 5-й элемент крупный (Spec 05)
const isBig = (index: number) => index % 5 === 4;

function Tile({ post, big }: { post: PostDto; big: boolean }) {
  const file = post.images[0];
  const url = mediaUrl(file);

  return (
    <Link
      href={`/p/${post.postId}`}
      className={cn(
        "relative block overflow-hidden bg-ig-bg-secondary",
        big && "col-span-2 row-span-2",
      )}
    >
      {url && isVideoFile(file) ? (
        <video
          src={url}
          muted
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
        />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={post.title || `Post by ${post.userName}`}
          className="absolute inset-0 size-full object-cover"
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

export function ExploreGrid({ tag }: { tag?: string }) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useExploreFeed(tag);
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

  const gridStyle = { gridAutoRows: ROW_HEIGHT };

  if (isPending) {
    return (
      <div style={{ containerType: "inline-size" }}>
        <div className="grid grid-cols-3 gap-1" style={gridStyle}>
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="size-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-16 text-center text-sm text-ig-text-secondary">
        Couldn&apos;t load posts. Try again later.
      </p>
    );
  }

  const items = data?.pages.flat() ?? [];

  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ig-text-secondary">
        {tag ? "No posts with this hashtag yet." : "Nothing to explore yet."}
      </p>
    );
  }

  return (
    <div style={{ containerType: "inline-size" }}>
      <div className="grid grid-flow-dense grid-cols-3 gap-1" style={gridStyle}>
        {items.map((post, i) => (
          <Tile key={post.postId} post={post} big={isBig(i)} />
        ))}
      </div>
      <div ref={sentinel} className="h-8" />
    </div>
  );
}