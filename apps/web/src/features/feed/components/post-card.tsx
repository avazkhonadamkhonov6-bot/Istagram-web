"use client";
import Image from "next/image";
import { FeedVideo } from "@/components/ui/feed-video";

import { PostOptions } from "@/features/posts/components/post-options";
import { SharePostDialog } from "@/features/posts/components/share-post-dialog";
import type { PostDto } from "@repo/shared";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
} from "@/components/ui/icons";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useAddComment, useToggleFavorite, useToggleLike } from "../hooks";
import { SmallAvatar } from "./small-avatar";

const TOKEN = /(#[\p{L}\p{N}_]+|@[a-z0-9._]+)/giu;
const CAPTION_LIMIT = 125;

export function renderCaption(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (part.length > 1 && part.startsWith("#")) {
      return (
        <Link
          key={i}
          href={`/explore/tags/${encodeURIComponent(part.slice(1))}`}
          className="text-ig-link hover:underline"
        >
          {part}
        </Link>
      );
    }
    if (part.length > 1 && part.startsWith("@")) {
      return (
        <Link
          key={i}
          href={`/${part.slice(1)}`}
          className="text-ig-link hover:underline"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function PostCard({
  post,
  priority = false,
}: {
  post: PostDto;
  priority?: boolean;
}) {
  const [share, setShare] = useState(false);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [text, setText] = useState("");
  const heartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (heartTimer.current) clearTimeout(heartTimer.current);
    },
    [],
  );

  const like = useToggleLike();
  const favorite = useToggleFavorite();
  const comment = useAddComment(post.postId);

  const files = post.images;
  const current = files[index];
  const url = mediaUrl(current);
  const content = post.content ?? "";
  const longCaption = content.length > CAPTION_LIMIT;
  const caption =
    longCaption && !expanded
      ? `${content.slice(0, CAPTION_LIMIT)}...`
      : content;

  const onDoubleTap = () => {
    if (!post.postLike && !like.isPending) like.mutate(post);
    setShowHeart(true);
    if (heartTimer.current) clearTimeout(heartTimer.current);
    heartTimer.current = setTimeout(() => setShowHeart(false), 700);
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    comment.mutate(value, { onSuccess: () => setText("") });
  };

  return (
    <article className="mb-5 border-b border-ig-separator pb-4">
      <header className="flex items-center gap-3 px-1 py-3">
        <SmallAvatar src={mediaUrl(post.userImage)} name={post.userName} />
        <div className="min-w-0 flex-1 text-sm leading-[18px]">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link href={`/${post.userName}`} className="truncate font-semibold">
              {post.userName}
            </Link>
            <span className="text-ig-text-secondary">
              &middot; {formatRelativeTime(new Date(post.datePublished).getTime())}
            </span>
          </div>
          {/* Joy — zeri username, misli Instagram */}
          {post.location && <Link href={`/explore/locations/${encodeURIComponent(post.location)}`} className="block truncate text-xs">{post.location}</Link>}
        </div>
        <PostOptions postId={post.postId} userId={post.userId} />
      </header>

      <div
        data-media
        className="relative aspect-[4/5] w-full select-none overflow-hidden rounded-sm border border-ig-separator bg-ig-bg-secondary"
        onDoubleClick={onDoubleTap}
      >
        {url && isVideoFile(current) ? (
          <FeedVideo src={url} className="object-cover" />
        ) : url ? (
          <Image
            preload={priority}
            unoptimized
            width={470}
            height={588}
            src={url}
            alt={post.title || `Post by ${post.userName}`}
            draggable={false}
            className="size-full object-cover"
          />
        ) : null}

        <Heart
          aria-hidden
          fill="currentColor"
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-ig-text-on-media transition-all duration-300",
            showHeart ? "animate-ig-heart" : "opacity-0",
          )}
        />

        {files.length > 1 ? (
          <>
            {index > 0 ? (
              <button
                type="button"
                aria-label="Previous"
                onClick={() => setIndex((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-ig-bg-elevated p-1 text-ig-text"
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : null}
            {index < files.length - 1 ? (
              <button
                type="button"
                aria-label="Next"
                onClick={() => setIndex((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ig-bg-elevated p-1 text-ig-text"
              >
                <ChevronRight className="size-4" />
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {files.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1">
          {files.map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full",
                i === index ? "bg-ig-primary" : "bg-ig-stroke",
              )}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-4 pb-1 pt-3">
        <button
          type="button"
          aria-label={post.postLike ? "Unlike" : "Like"}
          disabled={like.isPending}
          onClick={() => like.mutate(post)}
          className={cn("ig-post-action", post.postLike && "text-ig-badge ig-liked")}
        >
          <Heart
            className="size-6"
            fill={post.postLike ? "currentColor" : "none"}
          />
        </button>
        <Link href={`/p/${post.postId}`} aria-label="Comment">
          <MessageCircle className="size-6" />
        </Link>
        <button type="button" aria-label="Share" onClick={() => setShare(true)}>
          <Send className="size-6" />
        </button>
        <button
          type="button"
          aria-label={post.postFavorite ? "Unsave" : "Save"}
          disabled={favorite.isPending}
          onClick={() => favorite.mutate(post)}
          className="ig-post-action ml-auto"
        >
          <Bookmark
            className="size-6"
            fill={post.postFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      {!post.hideLikeCount && <p className="text-sm font-semibold">
        {formatCount(post.postLikeCount)}{" "}
        {post.postLikeCount === 1 ? "like" : "likes"}
      </p>}

      {post.content ? (
        <p className="mt-1 text-sm">
          <Link href={`/${post.userName}`} className="mr-1 font-semibold">
            {post.userName}
          </Link>
          {renderCaption(caption)}
          {longCaption && !expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="ml-1 text-ig-text-secondary"
            >
              more
            </button>
          ) : null}
        </p>
      ) : null}

      {!post.commentsDisabled && post.commentCount > 0 ? (
        <Link
          href={`/p/${post.postId}`}
          className="mt-1 block text-sm text-ig-text-secondary"
        >
          View all {formatCount(post.commentCount)} comments
        </Link>
      ) : null}

      {!post.commentsDisabled && <form onSubmit={submitComment} className="mt-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          aria-label="Add a comment"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {text.trim() ? (
          <button
            type="submit"
            disabled={comment.isPending}
            className="text-sm font-semibold text-ig-link-action"
          >
            Post
          </button>
        ) : null}
      </form>}
      {share && (
        <SharePostDialog
          postId={post.postId}
          open={share}
          onOpenChange={setShare}
        />
      )}
    </article>
  );
}
