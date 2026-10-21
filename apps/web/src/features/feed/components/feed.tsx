"use client";

import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useFeed } from "../hooks";
import { WindowedPost } from "./windowed-post";

function FeedSkeleton() {
  return (
    <div className="space-y-3 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function Feed() {
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed();
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
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <>
        <FeedSkeleton />
        <FeedSkeleton />
      </>
    );
  }

  if (isError) {
    return (
      <div className="py-10 text-center text-sm">
        <p className="text-ig-text-secondary">Could not load your feed.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 font-semibold text-ig-link-action"
        >
          Try again
        </button>
      </div>
    );
  }

  const posts = data.pages.flat();

  if (posts.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ig-text-secondary">
        No posts yet. Follow people to see their posts here.
      </p>
    );
  }

  return (
    <>
      {posts.map((post, index) => (
        <WindowedPost key={post.postId} post={post} index={index} />
      ))}
      <div ref={sentinel} className="flex h-10 items-center justify-center">
        {isFetchingNextPage ? <Spinner className="size-5" /> : null}
      </div>
    </>
  );
}
