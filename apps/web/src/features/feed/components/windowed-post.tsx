"use client";
import { WidgetBoundary } from "@/components/widget-boundary";
import type { PostDto } from "@repo/shared";
import { useEffect, useRef, useState } from "react";
import { PostCard } from "./post-card";

/** Keep nearby cards mounted and reserve measured space for distant posts. */
export function WindowedPost({
  post,
  index,
}: {
  post: PostDto;
  index: number;
}) {
  const node = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(800);
  const [visible, setVisible] = useState(index < 3);
  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "1200px" },
    );
    const resize = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height > 0) setHeight(entry.contentRect.height);
    });
    observer.observe(element);
    resize.observe(element);
    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, []);
  return (
    <div
      data-feed-post={post.postId}
      ref={node}
      style={visible ? undefined : { height }}
    >
      {visible ? (
        <WidgetBoundary name="Post">
          <PostCard post={post} priority={index === 0} />
        </WidgetBoundary>
      ) : null}
    </div>
  );
}
