"use client";
import Image from "next/image";
import { FeedVideo } from "@/components/ui/feed-video";

import { PostOptions } from "./post-options";
import { SharePostDialog } from "./share-post-dialog";
import type { CommentDto, PostDto } from "@repo/shared";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFollow } from "@/features/feed/hooks";
import { useIsFollowing } from "@/features/profile/hooks";
import { toast } from "@/components/ui/toast";
import { likeComment, pinComment } from "@/features/social/api";
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
import { renderCaption } from "@/features/feed/components/post-card";
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
  canPin,
  isReply,
  onReply,
  onDelete,
}: {
  comment: CommentDto;
  canDelete: boolean;
  canPin?: boolean;
  isReply?: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["comments", comment.postId] });
    void qc.invalidateQueries({ queryKey: ["replies"] });
  };
  const like = useMutation({ mutationFn: () => likeComment(comment.postCommentId), onSuccess: refresh, onError: () => toast.error("Could not update comment like.") });
  const pin = useMutation({ mutationFn: () => pinComment(comment.postCommentId), onSuccess: refresh, onError: () => toast.error("Could not pin comment. You can pin up to three comments.") });
  return (
    <div className="group flex gap-[14px] py-3">
      <Link href={`/${comment.userName}`} className="shrink-0">
        <SmallAvatar
          src={mediaUrl(comment.userImage)}
          name={comment.userName}
          className="size-8"
        />
      </Link>
      <div className="min-w-0 flex-1 text-sm leading-[18px]">
        <p className="break-words">
          <Link href={`/${comment.userName}`} className="mr-1 font-semibold">
            {comment.userName}
          </Link>
          {renderCaption(comment.comment)}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs leading-4 text-ig-text-secondary">
          <span>{formatRelativeTime(Date.parse(comment.dateCommented))}</span>
          {comment.isPinned && <span>Pinned</span>}
          {comment.likeCount > 0 && <span className="font-semibold">{comment.likeCount} {comment.likeCount === 1 ? "like" : "likes"}</span>}
          {canPin && !isReply && <button type="button" disabled={pin.isPending} onClick={() => pin.mutate()} className="font-semibold">{comment.isPinned ? "Unpin" : "Pin"}</button>}
          <button type="button" onClick={onReply} className="font-semibold">
            Reply
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="font-semibold text-ig-error opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
      <button type="button" className={cn("ig-post-action mt-1.5 self-start p-1", comment.isLiked ? "text-ig-badge" : "text-ig-text-secondary")} aria-label={comment.isLiked ? "Unlike comment" : "Like comment"} disabled={like.isPending} onClick={() => like.mutate()}><Heart className="size-3" strokeWidth={2.5} fill={comment.isLiked ? "currentColor" : "none"} /></button>
    </div>
  );
}

function CommentThread({
  comment,
  meId,
  canModerate,
  onReply,
  onDelete,
}: {
  comment: CommentDto;
  meId: string | undefined;
  canModerate: boolean;
  onReply: (rootId: number, userName: string) => void;
  onDelete: (commentId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const replies = useReplies(comment.postCommentId, open);

  return (
    <div>
      <CommentRow
        comment={comment}
        canPin={canModerate}
        canDelete={canModerate || meId === comment.userId}
        onReply={() => onReply(comment.postCommentId, comment.userName)}
        onDelete={() => onDelete(comment.postCommentId)}
      />
      {comment.replyCount > 0 ? (
        <div className="ml-[46px]">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-4 py-1 text-xs font-semibold text-ig-text-secondary"
          >
            <span aria-hidden className="h-px w-6 bg-ig-text-secondary" />
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
                  canDelete={canModerate || meId === r.userId}
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

export function PostDetail({
  postId,
  initialPost,
}: {
  postId: number;
  initialPost?: PostDto;
}) {
  const valid = Number.isInteger(postId) && postId > 0;
  const {
    data: post,
    isPending,
    isError,
  } = usePost(postId, valid, initialPost);
  const comments = useComments(postId, valid && !post?.commentsDisabled);
  const { data: me } = useMe();
  const like = usePostLike(postId);
  const favorite = usePostFavorite(postId);
  const addComment = useAddPostComment(postId);
  const deleteComment = useDeleteComment(postId);
  const qc = useQueryClient();
  const isOwn = !!me && !!post && me.userId === post.userId;
  const following = useIsFollowing(post?.userId ?? "", !!me && !!post && !isOwn);
  const follow = useFollow();

  const [share, setShare] = useState(false);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: number;
    userName: string;
  } | null>(null);
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

  const followButton =
    me && !isOwn && following.data === false ? (
      <>
        <span aria-hidden className="text-ig-text-secondary">&middot;</span>
        <button
          type="button"
          disabled={follow.isPending}
          onClick={() =>
            follow.mutate(post.userId, {
              onSuccess: () =>
                void qc.invalidateQueries({ queryKey: ["is-follow", post.userId] }),
              onError: () => toast.error("Could not follow. Try again."),
            })
          }
          className="font-semibold text-[rgb(var(--ig-colors-button-borderless-text))] hover:text-[rgb(var(--ig-colors-button-borderless-text--hover))]"
        >
          Follow
        </button>
      </>
    ) : null;

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
    if (!value || post.commentsDisabled) return;
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
      <header className="flex shrink-0 items-center gap-3 border-b border-ig-elevated-separator px-4 py-3 md:hidden">
        <SmallAvatar src={mediaUrl(post.userImage)} name={post.userName} />
        <div className="flex min-w-0 items-center gap-1 text-sm">
          <Link href={`/${post.userName}`} className="truncate font-semibold">
            {post.userName}
          </Link>
          {followButton}
        </div>
        <span className="ml-auto">
          <PostOptions postId={post.postId} userId={post.userId} />
        </span>
      </header>
      <div
        className="ig-post-media relative flex aspect-square w-full shrink-0 items-center justify-center md:aspect-auto md:min-w-0 md:flex-1"
        onDoubleClick={() => {
          if (!post.postLike) like.mutate();
        }}
      >
        {url && isVideoFile(current) ? (
          <FeedVideo src={url} className="object-contain" />
        ) : url ? (
          <Image
            unoptimized
            width={800}
            height={800}
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
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[rgba(255,255,255,.8)] p-1.5 text-[rgb(38,38,38)] shadow-ig-strong hover:bg-white"
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : null}
        {files.length > 1 && index < files.length - 1 ? (
          <button
            type="button"
            aria-label="Next"
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[rgba(255,255,255,.8)] p-1.5 text-[rgb(38,38,38)] shadow-ig-strong hover:bg-white"
          >
            <ChevronRight className="size-4" />
          </button>
        ) : null}
        {files.length > 1 ? (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
            {files.map((f, i) => (
              <span
                key={f}
                className={cn("size-1.5 rounded-full bg-white", i === index ? "opacity-100" : "opacity-40")}
              />
            ))}
          </div>
        ) : null}
      </div>

      {share && (
        <SharePostDialog postId={postId} open={share} onOpenChange={setShare} />
      )}
      <div className="flex min-h-0 w-full flex-1 flex-col border-ig-elevated-separator bg-ig-bg-elevated md:w-[405px] md:flex-none md:shrink-0 md:border-l xl:w-[500px]">
        <header className="hidden min-h-[60px] items-center gap-3 border-b border-ig-elevated-separator py-[14px] pl-4 pr-2 md:flex">
          <Link href={`/${post.userName}`} className="shrink-0">
            <SmallAvatar src={mediaUrl(post.userImage)} name={post.userName} />
          </Link>
          <div className="flex min-w-0 items-center gap-1 text-sm">
            <Link href={`/${post.userName}`} className="truncate font-semibold hover:opacity-60">
              {post.userName}
            </Link>
            {followButton}
          </div>
          <span className="ml-auto">
            <PostOptions postId={post.postId} userId={post.userId} />
          </span>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-1">
          {post.content ? (
            <div className="flex gap-[14px] py-3">
              <Link href={`/${post.userName}`} className="shrink-0">
                <SmallAvatar
                  src={mediaUrl(post.userImage)}
                  name={post.userName}
                />
              </Link>
              <div className="min-w-0 flex-1 text-sm leading-[18px]">
                <p className="whitespace-pre-line break-words">
                  <Link href={`/${post.userName}`} className="mr-1 font-semibold">{post.userName}</Link>
                  {renderCaption(post.content)}
                </p>
                <p className="mt-2 text-xs text-ig-text-secondary">
                  {formatRelativeTime(Date.parse(post.datePublished))}
                </p>
              </div>
            </div>
          ) : null}

          {post.commentsDisabled && <p className="py-6 text-center text-sm text-ig-text-secondary">Comments are turned off.</p>}
          {!post.commentsDisabled && comments.isPending ? (
            <Skeleton className="mt-2 h-10 w-full" />
          ) : null}
          {!post.commentsDisabled && roots.map((c) => (
            <CommentThread
              key={c.postCommentId}
              comment={c}
              meId={me?.userId}
              canModerate={me?.userId === post.userId}
              onReply={startReply}
              onDelete={(id) => deleteComment.mutate(id)}
            />
          ))}
          {!post.commentsDisabled && comments.hasNextPage ? (
            <button
              type="button"
              onClick={() => void comments.fetchNextPage()}
              disabled={comments.isFetchingNextPage}
              aria-label="Load more comments"
              className="mx-auto my-2 flex size-6 items-center justify-center rounded-full border border-ig-text text-ig-text hover:opacity-60"
            >
              <span aria-hidden className="text-base leading-none">+</span>
            </button>
          ) : null}
          {!post.commentsDisabled && !comments.isPending && roots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-2xl font-bold">No comments yet.</p>
              <p className="mt-2 text-sm">Start the conversation.</p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-ig-elevated-separator px-4 pb-3 pt-1.5">
          <div className="-ml-2 flex items-center pb-1.5">
            <button
              type="button"
              aria-label={post.postLike ? "Unlike" : "Like"}
              onClick={() => like.mutate()}
              className={cn("ig-post-action p-2", post.postLike && "ig-liked text-ig-badge")}
            >
              <Heart
                className="size-6"
                fill={post.postLike ? "currentColor" : "none"}
              />
            </button>
            <button
              type="button"
              aria-label="Comment"
              onClick={() => inputRef.current?.focus()}
              className="ig-post-action p-2"
            >
              <MessageCircle className="size-6 -scale-x-100" />
            </button>
            <button type="button" aria-label="Share" onClick={() => setShare(true)} className="ig-post-action p-2">
              <Send className="size-6" />
            </button>
            <button
              type="button"
              aria-label={post.postFavorite ? "Unsave" : "Save"}
              onClick={() => favorite.mutate()}
              className="ig-post-action -mr-2 ml-auto p-2"
            >
              <Bookmark
                className="size-6"
                fill={post.postFavorite ? "currentColor" : "none"}
              />
            </button>
          </div>
          {!post.hideLikeCount && (post.postLikeCount > 0 ? (
            <p className="text-sm font-semibold">
              {formatCount(post.postLikeCount)}{" "}
              {post.postLikeCount === 1 ? "like" : "likes"}
            </p>
          ) : (
            <p className="text-sm">
              Be the first to{" "}
              <button type="button" onClick={() => like.mutate()} className="font-semibold">like this</button>
            </p>
          ))}
          <p className="mt-1 text-xs text-ig-text-secondary">
            {formatRelativeTime(Date.parse(post.datePublished))}
          </p>
        </div>

        {!post.commentsDisabled && <form
          onSubmit={submit}
          className={cn(
            "flex min-h-[53px] items-center gap-3 border-t border-ig-elevated-separator px-4 py-2",
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
          <button
            type="submit"
            disabled={addComment.isPending || !text.trim()}
            className="text-sm font-semibold text-[rgb(var(--ig-colors-button-borderless-text))] hover:text-[rgb(var(--ig-colors-button-borderless-text--hover))] disabled:text-[rgb(var(--ig-colors-button-borderless-text--disabled))]"
          >
            Post
          </button>
        </form>}
      </div>
    </div>
  );
}
