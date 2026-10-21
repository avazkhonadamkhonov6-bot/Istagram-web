"use client";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Send, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { useMe } from "@/features/auth/hooks";
import { replyStory } from "@/features/social/api";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { usePost } from "@/features/posts/hooks";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { formatRelativeTime } from "@/lib/format";
import { getStories, likeStory, storyKey, viewStory } from "../api";

export function StoryViewer({ username }: { username: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: storyKey, queryFn: getStories });
  const { data: me } = useMe();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(5000);
  const [liking, setLiking] = useState(false);
  const [reply, setReply] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const users = useMemo(
    () => query.data?.filter((u) => u.stories.length) ?? [],
    [query.data],
  );
  const userIndex = users.findIndex((u) => u.userName === username);
  const user = users[userIndex];
  const story = user?.stories[index];
  const repost = usePost(story?.postId ?? 0, !!story?.postId);
  const file = story?.fileName ?? repost.data?.images[0];
  const sendReply = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => replyStory(id, text),
    onSuccess: () => { setReply(""); toast("Reply sent"); void qc.invalidateQueries({ queryKey: ["chats"] }); },
    onError: () => toast.error("Could not send reply."),
  });
  const activePause = paused || holding || reply.length > 0 || sendReply.isPending;
  const storyId = story?.id;
  const storyUserId = story?.userId;
  const heldAt = useRef(0);
  const move = useCallback(
    (direction: number) => {
      if (!user) return;
      const next = index + direction;
      if (next >= 0 && next < user.stories.length) setIndex(next);
      else if (users[userIndex + direction]) {
        setIndex(0);
        router.replace(
          `/stories/${encodeURIComponent(users[userIndex + direction].userName)}`,
        );
      } else router.push("/");
      setProgress(0);
      setDuration(5000);
    },
    [index, router, user, users, userIndex],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/");
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, router]);
  useEffect(() => {
    if (!storyId || storyUserId === me?.userId) return;
    void viewStory(storyId)
      .then(() => qc.invalidateQueries({ queryKey: storyKey }))
      .catch(() => undefined);
  }, [storyId, storyUserId, me?.userId, qc]);
  useEffect(() => {
    if (activePause || !storyId || !file) return;
    const timer = window.setInterval(
      () => setProgress((p) => Math.min(1, p + 50 / duration)),
      50,
    );
    return () => clearInterval(timer);
  }, [activePause, storyId, file, duration]);
  useEffect(() => {
    if (progress < 1) return;
    const timer = window.setTimeout(() => move(1), 0);
    return () => clearTimeout(timer);
  }, [progress, move]);
  useEffect(() => {
    if (activePause) video.current?.pause();
    else void video.current?.play().catch(() => undefined);
  }, [activePause, file]);
  if (query.isPending)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner />
      </div>
    );
  if (!story || query.isError)
    return (
      <div className="grid min-h-dvh place-content-center gap-4 text-center">
        <p>This story is no longer available.</p>
        <Link href="/">Back to feed</Link>
      </div>
    );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ig-story text-ig-text-on-media">
      <Link
        href="/"
        className="absolute left-8 top-8 hidden font-logo text-4xl md:block"
      >
        Instagram
      </Link>
      <Link
        href="/"
        aria-label="Close stories"
        className="absolute right-4 top-4 z-20 rounded-full bg-ig-media-blur p-2"
      >
        <X />
      </Link>
      <div className="relative h-full max-h-[900px] w-full overflow-hidden md:aspect-[9/16] md:h-[calc(100dvh-40px)] md:w-auto md:rounded-xl">
        {isVideoFile(file ?? "") ? (
          <video
            ref={video}
            src={mediaUrl(file) ?? undefined}
            autoPlay
            playsInline
            onLoadedMetadata={(e) =>
              setDuration(Math.min(e.currentTarget.duration * 1000, 60000))
            }
            className="size-full object-contain"
          />
        ) : file ? (
          <Image
            unoptimized
            width={480}
            height={854}
            src={mediaUrl(file)!}
            alt={`Story by ${username}`}
            className="size-full object-contain"
          />
        ) : null}
        <div className="absolute inset-x-0 top-0 z-10 bg-ig-media-blur px-3 pb-4 pt-4">
          <div className="mb-4 flex gap-1">
            {user.stories.map((s, i) => (
              <div
                key={s.id}
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-ig-text-on-media/30"
              >
                <div
                  className="h-full bg-ig-text-on-media"
                  style={{
                    width: `${i < index ? 100 : i === index ? progress * 100 : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <SmallAvatar src={mediaUrl(user.userImage)} name={username} />
            <Link href={`/${username}`} className="font-semibold">
              {username}
            </Link>
            <span className="text-xs opacity-70">
              {formatRelativeTime(Date.parse(story.createAt))}
            </span>
            <button
              className="ml-auto mr-12 p-2"
              aria-label={paused ? "Play story" : "Pause story"}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (
                <Play className="size-5" />
              ) : (
                <Pause className="size-5" />
              )}
            </button>
          </div>
        </div>
        <div
          className="absolute inset-x-0 bottom-20 top-28 flex"
          onPointerDown={() => {
            heldAt.current = Date.now();
            setHolding(true);
          }}
          onPointerUp={() => setHolding(false)}
          onPointerLeave={() => setHolding(false)}
          onPointerCancel={() => setHolding(false)}
        >
          <button
            aria-label="Previous story"
            onClick={() => {
              if (Date.now() - heldAt.current < 250) move(-1);
            }}
            className="w-1/3"
          />
          <button
            aria-label="Next story"
            onClick={() => {
              if (Date.now() - heldAt.current < 250) move(1);
            }}
            className="flex-1"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-ig-media-blur p-4">
          {story.userId !== me?.userId && <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (reply.trim()) sendReply.mutate({ id: story.id, text: reply.trim() }); }}>
            <input aria-label="Reply to story" placeholder={`Reply to ${username}…`} value={reply} maxLength={1000} onChange={(e) => setReply(e.target.value)} className="min-w-0 flex-1 rounded-full border border-ig-text-on-media/60 bg-transparent px-4 py-3 text-sm outline-none" />
            {reply.trim() && <button type="submit" aria-label="Send reply" disabled={sendReply.isPending}><Send className="size-5" /></button>}
          </form>}
          {story.userId === me?.userId ? (
            <p className="text-sm">
              {story.viewerDto.viewCount ?? 0} views ·{" "}
              {story.viewerDto.viewLike ?? 0} likes
            </p>
          ) : (
            <Button
              variant="borderless"
              disabled={liking}
              aria-label={story.liked ? "Unlike story" : "Like story"}
              onClick={() => {
                setLiking(true);
                void likeStory(story.id)
                  .then(() => qc.invalidateQueries({ queryKey: storyKey }))
                  .catch(() => toast.error("Could not update story like."))
                  .finally(() => setLiking(false));
              }}
            >
              <Heart
                className={
                  story.liked
                    ? "fill-current text-ig-badge"
                    : "text-ig-text-on-media"
                }
              />
            </Button>
          )}
          {story.postId && (
            <Link href={`/p/${story.postId}`} className="text-sm font-semibold">
              View post
            </Link>
          )}
        </div>
      </div>
      <button
        aria-label="Previous story"
        onClick={() => move(-1)}
        className="ml-[-540px] hidden rounded-full bg-ig-media-blur p-2 lg:absolute lg:block"
      >
        <ChevronLeft />
      </button>
      <button
        aria-label="Next story"
        onClick={() => move(1)}
        className="mr-[-540px] hidden rounded-full bg-ig-media-blur p-2 lg:absolute lg:block"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
