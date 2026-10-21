"use client";

import type { CommentDto } from "@repo/shared";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import {
  useAddPostComment,
  useComments,
  useDeleteComment,
  usePost,
  usePostFavorite,
  usePostLike,
  useReplies,
} from "../hooks";

function CommentRow({
  comment,
  canDelete,
  isReply,
  onReply,
  onDelete,
}: {
  comment: CommentDto;
  canDelete: boolean;
  isReply?: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-3 py-2">
      <SmallAvatar
        src={mediaUrl(comment.userImage)}
        name={comment.userName}
        className={isReply ? "size-6" : "size-8"}
      />
      <div className="min-w-0 flex-1 text-sm">
        <p className="break-words">
          <Link href={`/${comment.userName}`} className="mr-1 font-semibold">
            {comment.userName}
          </Link>
          {comment.comment}
        </p>
        <div className="mt-1 flex gap-3 text-xs text-ig-text-secondary">
          <span>{formatRelativeTime(Date.parse(comment.dateCommented))}</span>
          <button type="button" onClick={onReply} className="font-semibold">
            Reply
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="font-semibold text-ig-error"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  meId,
  onReply,
  onDelete,
}: {
  comment: CommentDto;
  meId: string | undefined;
  onReply: (rootId: number, userName: string) => void;
  onDelete: (commentId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const replies = useReplies(comment.postCommentId, open);

  return (
    <div>
      <CommentRow
        comment={comment}
        canDelete={meId === comment.userId}
        onReply={() => onReply(comment.postCommentId, comment.userName)}
        onDelete={() => onDelete(comment.postCommentId)}
      />
      {comment.replyCount > 0 ? (
        <div className="ml-11">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-xs font-semibold text-ig-text-secondary"
          >
            {open ? "Hide replies" : `View replies (${comment.replyCount})`}
          </button>
          {open ? (
            replies.isPending ? (
              <Skeleton className="mt-2 h-8 w-full" />
            ) : (
              (replies.data ?? []).map((r) => (
                <CommentRow
                  key={r.postCommentId}
                  comment={r}
                  isReply
                  canDelete={meId === r.userId}
                  onReply={() => onReply(comment.postCommentId, r.userName)}
                  onDelete={() => onDelete(r.postCommentId)}
                />
              ))
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PostDetail({ postId }: { postId: number }) {
  const valid = Number.isInteger(postId) && postId > 0;
  const { data: post, isPending, isError } = usePost(postId, valid);
  const comments = useComments(postId, valid);
  const { data: me } = useMe();
  const like = usePostLike(postId);
  const favorite = usePostFavorite(postId);
  const addComment = useAddPostComment(postId);
  const deleteComment = useDeleteComment(postId);

  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; userName: string } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  if (!valid || isError) {
    return (
      <p className="m-auto p-10 text-sm text-ig-text-secondary">
        This post is not available.
      </p>
    );
  }
  if (isPending || !post) {
    return (
      <div className="flex size-full flex-col md:flex-row">
        <Skeleton className="aspect-square w-full md:aspect-auto md:flex-1" />
        <div className="w-full space-y-3 p-4 md:w-[335px]">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  const files = post.images;
  const current = files[index];
  const url = mediaUrl(current);
  const roots = comments.data?.pages.flat() ?? [];

  const startReply = (rootId: number, userName: string) => {
    setReplyTo({ id: rootId, userName });
    setText(`@${userName} `);
    inputRef.current?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    addComment.mutate(
      { text: value, parentId: replyTo?.id },
      {
        onSuccess: () => {
          setText("");
          setReplyTo(null);
        },
      },
    );
  };

  return (
    <div className="flex size-full flex-col md:flex-row">
      <div className="relative aspect-square w-full shrink-0 bg-ig-bg-secondary md:aspect-auto md:flex-1">
        {url && isVideoFile(current) ? (
          <video
            src={url}
            controls
            playsInline
            className="size-full object-contain"
          />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={post.title || `Post by ${post.userName}`}
            className="size-full object-contain"
          />
        ) : null}
        {files.length > 1 && index > 0 ? (
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setIndex((i) => i - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-ig-bg-elevated p-1 text-ig-text"
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : null}
        {files.length > 1 && index < files.length - 1 ? (
          <button
            type="button"
            aria-label="Next"
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ig-bg-elevated p-1 text-ig-text"
          >
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 w-full flex-col border-ig-separator bg-ig-bg-elevated md:w-[335px] md:shrink-0 md:border-l">
        <header className="flex items-center gap-3 border-b border-ig-separator p-4">
          <SmallAvatar src={mediaUrl(post.userImage)} name={post.userName} />
          <Link href={`/${post.userName}`} className="text-sm font-semibold">
            {post.userName}
          </Link>
        </header>

        <div className="max-h-[320px] min-h-0 flex-1 overflow-y-auto px-4 py-2 md:max-h-none">
          {post.content ? (
            <div className="flex gap-3 py-2">
              <SmallAvatar
                src={mediaUrl(post.userImage)}
                name={post.userName}
              />
              <p className="min-w-0 flex-1 break-words text-sm">
                <span className="mr-1 font-semibold">{post.userName}</span>
                {post.content}
              </p>
            </div>
          ) : null}

          {comments.isPending ? <Skeleton className="mt-2 h-10 w-full" /> : null}
          {roots.map((c) => (
            <CommentThread
              key={c.postCommentId}
              comment={c}
              meId={me?.userId}
              onReply={startReply}
              onDelete={(id) => deleteComment.mutate(id)}
            />
          ))}
          {comments.hasNextPage ? (
            <button
              type="button"
              onClick={() => void comments.fetchNextPage()}
              disabled={comments.isFetchingNextPage}
              className="py-2 text-xs font-semibold text-ig-text-secondary"
            >
              Load more comments
            </button>
          ) : null}
          {!comments.isPending && roots.length === 0 ? (
            <p className="py-6 text-center text-sm text-ig-text-secondary">
              No comments yet.
            </p>
          ) : null}
        </div>

        <div className="border-t border-ig-separator p-4">
          <div className="flex items-center gap-4 pb-2">
            <button
              type="button"
              aria-label={post.postLike ? "Unlike" : "Like"}
              onClick={() => like.mutate()}
              className={post.postLike ? "text-ig-badge" : undefined}
            >
              <Heart
                className="size-6"
                fill={post.postLike ? "currentColor" : "none"}
              />
            </button>
            <MessageCircle className="size-6" aria-hidden />
            <Send className="size-6" aria-hidden />
            <button
              type="button"
              aria-label={post.postFavorite ? "Unsave" : "Save"}
              onClick={() => favorite.mutate()}
              className="ml-auto"
            >
              <Bookmark
                className="size-6"
                fill={post.postFavorite ? "currentColor" : "none"}
              />
            </button>
          </div>
          <p className="text-sm font-semibold">
            {formatCount(post.postLikeCount)}{" "}
            {post.postLikeCount === 1 ? "like" : "likes"}
          </p>
          <p className="text-xs text-ig-text-secondary">
            {formatRelativeTime(Date.parse(post.datePublished))}
          </p>
        </div>

        <form
          onSubmit={submit}
          className={cn(
            "flex items-center gap-2 border-t border-ig-separator px-4 py-3",
          )}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              replyTo ? `Reply to ${replyTo.userName}...` : "Add a comment..."
            }
            aria-label="Add a comment"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {replyTo ? (
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setText("");
              }}
              className="text-xs text-ig-text-secondary"
            >
              Cancel
            </button>
          ) : null}
          {text.trim() ? (
            <button
              type="submit"
              disabled={addComment.isPending}
              className="text-sm font-semibold text-ig-link-action"
            >
              Post
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}