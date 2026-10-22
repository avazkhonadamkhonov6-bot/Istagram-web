"use client";
import { postDtoSchema, type PostDto } from "@repo/shared";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Play,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { favoritePost, likePost } from "@/features/feed/api";
import { useMe } from "@/features/auth/hooks";
import { useIsFollowing, profileKeys } from "@/features/profile/hooks";
import { followUser } from "@/features/profile/api";
import { useMutation } from "@tanstack/react-query";
import { SharePostDialog } from "@/features/posts/components/share-post-dialog";
import { api } from "@/lib/api-client";
import { formatCount } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
const key = ["reels"];

// Ovoz baroi hamai reel-ho yakest (misli Instagram): yak bor unmute — reel-i bad ham bo ovoz.
// Brauzer autoplay-ro bo ovoz bidun amali user man' mekunad; on gah muted ogoz meshavad.
let reelsMuted = false;
const muteListeners = new Set<() => void>();
function setReelsMuted(value: boolean) {
  reelsMuted = value;
  muteListeners.forEach((l) => l());
}
function useReelsMuted() {
  return useSyncExternalStore(
    (l) => {
      muteListeners.add(l);
      return () => muteListeners.delete(l);
    },
    () => reelsMuted,
    () => true,
  );
}

/** play() bo ovoz; agar brauzer man' kunad — muted */
function playWithSound(el: HTMLVideoElement | null) {
  if (!el) return Promise.reject(new Error("no video"));
  el.muted = reelsMuted;
  return el.play().catch((err: unknown) => {
    if (el.muted || (err as Error).name !== "NotAllowedError") throw err;
    setReelsMuted(true);
    el.muted = true;
    return el.play();
  });
}
function Reel({ post, loadMore }: { post: PostDto; loadMore?: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const muted = useReelsMuted();
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(post.postLike);
  const [likes, setLikes] = useState(post.postLikeCount);
  const [saved, setSaved] = useState(post.postFavorite);
  const [heart, setHeart] = useState(false);
  const [share, setShare] = useState(false);
  const likePending = useRef(false);
  const savePending = useRef(false);
  const seen = useRef(false);
  const heartTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: following } = useIsFollowing(
    post.userId,
    me?.userId !== post.userId,
  );
  const follow = useMutation({
    mutationFn: () => followUser(post.userId),
    onSuccess: () => {
      qc.setQueryData(profileKeys.isFollow(post.userId), true);
    },
    onError: () => toast.error("Could not follow. Try again."),
  });
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting;
        if (visible) {
          if (!paused)
            void playWithSound(video.current)
              .then(() => setPlaying(true))
              .catch(() => setPlaying(false));
          loadMore?.();
          if (!seen.current && !paused)
            timer = setTimeout(() => {
              seen.current = true;
              void api(`/Post/view-post?postId=${post.postId}`, {
                method: "POST",
              }).catch(() => {
                seen.current = false;
              });
            }, 2000);
        } else {
          video.current?.pause();
          setPlaying(false);
          clearTimeout(timer);
        }
      },
      { threshold: 0.65 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [post.postId, paused, loadMore]);
  useEffect(() => () => clearTimeout(heartTimer.current), []);
  async function toggleLike(onlyLike = false) {
    if (likePending.current || (onlyLike && liked)) return;
    likePending.current = true;
    const old = liked;
    setLiked(!old);
    setLikes((n) => n + (old ? -1 : 1));
    try {
      const result = await likePost(post.postId);
      setLiked(result.isLiked);
      setLikes(result.likeCount);
      void qc.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      setLiked(old);
      setLikes((n) => n + (old ? 1 : -1));
      toast.error("Could not update like.");
    } finally {
      likePending.current = false;
    }
  }
  async function toggleSave() {
    if (savePending.current) return;
    savePending.current = true;
    const old = saved;
    setSaved(!old);
    try {
      const result = await favoritePost(post.postId);
      setSaved(result.isFavorite);
    } catch {
      setSaved(old);
      toast.error("Could not save reel.");
    } finally {
      savePending.current = false;
    }
  }
  return (
    <section className="flex h-[calc(100dvh-110px)] snap-start items-center justify-center gap-3 py-2 md:h-dvh md:gap-5 md:py-6">
      <div
        ref={container}
        className="relative h-full max-w-full overflow-hidden bg-ig-story text-ig-text-on-media md:aspect-[9/16] md:rounded-lg"
      >
        <video
          ref={video}
          src={mediaUrl(post.images[0]) ?? undefined}
          muted={muted}
          playsInline
          loop
          preload="metadata"
          className="h-full w-full object-cover"
          onClick={() => {
            if (playing) {
              video.current?.pause();
              setPaused(true);
              setPlaying(false);
            } else {
              void playWithSound(video.current)
                .then(() => {
                  setPaused(false);
                  setPlaying(true);
                })
                .catch(() => undefined);
            }
          }}
          onDoubleClick={() => {
            void toggleLike(true);
            setHeart(true);
            clearTimeout(heartTimer.current);
            heartTimer.current = setTimeout(() => setHeart(false), 700);
          }}
        />
        {!playing && (
          <Play
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 fill-current opacity-80"
          />
        )}
        {heart && (
          <Heart
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 animate-ig-heart fill-current"
          />
        )}
        <button
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            const next = !muted;
            setReelsMuted(next);
            if (video.current) {
              video.current.muted = next;
              if (!next && video.current.paused && !paused) void video.current.play().then(() => setPlaying(true)).catch(() => undefined);
            }
          }}
          className="absolute right-4 top-4 rounded-full bg-ig-media-blur p-2"
        >
          {muted ? (
            <VolumeX className="size-5" />
          ) : (
            <Volume2 className="size-5" />
          )}
        </button>
        <div className="absolute inset-x-0 bottom-0 space-y-3 bg-ig-media-blur p-4 pr-14 md:pr-4">
          <Link
            href={`/${post.userName}`}
            className="flex items-center gap-3 font-semibold"
          >
            <SmallAvatar src={mediaUrl(post.userImage)} name={post.userName} />
            {post.userName}
          </Link>
          {me?.userId !== post.userId && !following && (
            <button
              onClick={() => follow.mutate()}
              disabled={follow.isPending}
              className="rounded-md border border-ig-text-on-media px-3 py-1 text-sm font-semibold"
            >
              Follow
            </button>
          )}
          <p className="line-clamp-3 leading-5">{post.content}</p>
        </div>
        <div className="absolute bottom-5 right-2 flex flex-col items-center gap-5 md:hidden">
          <button
            aria-label={liked ? "Unlike" : "Like"}
            onClick={() => void toggleLike()}
          >
            <Heart className={liked ? "fill-current text-ig-badge" : ""} />
            <span className="text-xs">{formatCount(likes)}</span>
          </button>
          <Link href={`/p/${post.postId}`} aria-label="Comment">
            <MessageCircle />
          </Link>
          <button aria-label="Share" onClick={() => setShare(true)}>
            <Send />
          </button>
          <button
            aria-label={saved ? "Unsave" : "Save"}
            onClick={() => void toggleSave()}
          >
            <Bookmark fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <div className="hidden self-end pb-6 md:flex md:flex-col md:items-center md:gap-6">
        <button
          aria-label={liked ? "Unlike" : "Like"}
          onClick={() => void toggleLike()}
          className="flex flex-col items-center gap-1"
        >
          <Heart className={liked ? "fill-current text-ig-badge" : ""} />
          <span className="text-xs">{formatCount(likes)}</span>
        </button>
        <Link
          href={`/p/${post.postId}`}
          aria-label="Comment"
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle />
          <span className="text-xs">{formatCount(post.commentCount)}</span>
        </Link>
        <button aria-label="Share" onClick={() => setShare(true)}>
          <Send />
        </button>
        <button
          aria-label={saved ? "Unsave" : "Save"}
          onClick={() => void toggleSave()}
        >
          <Bookmark fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      {share && (
        <SharePostDialog
          postId={post.postId}
          open={share}
          onOpenChange={setShare}
        />
      )}
    </section>
  );
}
export function ReelsFeed() {
  const reels = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) =>
      api(`/Post/get-reels?PageNumber=${pageParam}&PageSize=5`, {
        schema: postDtoSchema.array(),
      }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) =>
      last.length === 5 ? pages.length + 1 : undefined,
  });
  if (reels.isPending)
    return (
      <div className="grid h-[80dvh] place-items-center">
        <Spinner />
      </div>
    );
  if (reels.isError)
    return (
      <div className="py-20 text-center">
        <p>Could not load reels.</p>
        <Button variant="borderless" onClick={() => void reels.refetch()}>
          Try again
        </Button>
      </div>
    );
  const posts = reels.data.pages.flat();
  if (!posts.length)
    return (
      <div className="grid h-[80dvh] place-content-center gap-3 text-center">
        <Play className="mx-auto size-12" />
        <h1 className="text-xl font-semibold">No reels yet</h1>
        <p className="text-ig-text-secondary">
          Share a video to start something new.
        </p>
      </div>
    );
  return (
    <div className="no-scrollbar h-[calc(100dvh-110px)] snap-y snap-mandatory overflow-y-auto md:h-dvh">
      {posts.map((post, i) => (
        <Reel
          key={post.postId}
          post={post}
          loadMore={
            i === posts.length - 1 &&
            reels.hasNextPage &&
            !reels.isFetchingNextPage
              ? () => {
                  void reels.fetchNextPage();
                }
              : undefined
          }
        />
      ))}
      {reels.isFetchingNextPage && (
        <div className="grid h-20 place-items-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
