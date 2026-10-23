"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SocketEvent } from "@repo/shared";
import { useEffect } from "react";
import { StoryRing } from "@/components/ui/story-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { mediaUrl } from "@/lib/media";
import { useUiStore } from "@/store/ui.store";
import { getLives } from "@/features/rtc/api";
import { getSocket } from "@/lib/socket";
import { getStories, storyKey } from "../api";
export function StoriesTray() {
  const stories = useQuery({ queryKey: storyKey, queryFn: getStories });
  const { data: me } = useMe();
  const create = useUiStore((s) => s.setCreateOpen);
  const qc = useQueryClient();
  // Efirhoi faol (Spec 16 §3): dar avvali qatori story, misli Instagram
  const lives = useQuery({ queryKey: ["lives"], queryFn: getLives, refetchInterval: 30_000 });
  useEffect(() => {
    const socket = getSocket();
    const refresh = () => void qc.invalidateQueries({ queryKey: ["lives"] });
    socket.on(SocketEvent.LIVE_STARTED, refresh);
    socket.on(SocketEvent.LIVE_ENDED, refresh);
    return () => {
      socket.off(SocketEvent.LIVE_STARTED, refresh);
      socket.off(SocketEvent.LIVE_ENDED, refresh);
    };
  }, [qc]);
  const liveUsers = new Set((lives.data ?? []).map((l) => l.user.id));
  // Story-i xudam — dar doirai "Your story" (misli Instagram), na alohida dar ruyxat
  const mine = stories.data?.find((u) => u.userId === me?.userId && u.stories.length > 0);
  return (
    <section
      aria-label="Stories"
      className="ig-stories-tray no-scrollbar -mx-2 mb-5 flex gap-4 overflow-x-auto px-2 py-2"
    >
      {mine ? (
        <div className="ig-story-item relative flex shrink-0 flex-col items-center gap-2">
          <Link
            aria-label="Your story"
            href={`/stories/${encodeURIComponent(mine.userName)}`}
            className="flex flex-col items-center gap-2"
          >
            <StoryRing
              className="ig-story-frame"
              state={mine.hasUnseen ? (mine.hasCloseFriends ? "close-friends" : "unseen") : "seen"}
            >
              <SmallAvatar src={mediaUrl(me?.image)} name={me?.userName ?? "You"} className="ig-story-avatar" />
            </StoryRing>
            <span className="text-xs text-ig-text-secondary">Your story</span>
          </Link>
          {/* "+" — story-i nav; click ba doira — didani story-i xud */}
          <button
            type="button"
            onClick={() => create(true)}
            aria-label="Add to your story"
            className="absolute right-0 top-[calc(var(--ig-story-avatar-size)-12px)] rounded-full"
          >
            <Plus className="size-5 rounded-full border-2 border-ig-bg bg-ig-primary text-ig-text-on-color" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => create(true)}
          className="ig-story-item flex shrink-0 flex-col items-center gap-2"
          aria-label="Your story"
        >
          <span className="ig-story-frame relative p-[5px]">
            <SmallAvatar
              src={mediaUrl(me?.image)}
              name={me?.userName ?? "You"}
              className="ig-story-avatar"
            />
            <Plus className="absolute bottom-0 right-0 size-5 rounded-full border-2 border-ig-bg bg-ig-primary text-ig-text-on-color" />
          </span>
          <span className="text-xs text-ig-text-secondary">Your story</span>
        </button>
      )}
      {(lives.data ?? []).map((live) => (
        <Link
          key={`live-${live.liveId}`}
          aria-label={`${live.user.userName} is live`}
          href={`/live/${live.liveId}`}
          className="ig-story-item flex shrink-0 flex-col items-center gap-2"
        >
          <span className="ig-story-frame relative">
            <span className="block rounded-full bg-[linear-gradient(45deg,rgb(var(--decorative-ig-lavender)),rgb(var(--ig-live-badge)))] p-[2px]">
              <span className="block rounded-full bg-ig-bg p-[3px]">
                <SmallAvatar src={mediaUrl(live.user.avatar)} name={live.user.userName} className="ig-story-avatar" />
              </span>
            </span>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-[4px] border-2 border-ig-bg bg-[linear-gradient(90deg,rgb(var(--decorative-ig-lavender)),rgb(var(--ig-live-badge)))] px-1 text-[10px] font-bold leading-[14px] tracking-wide text-ig-text-on-color">
              LIVE
            </span>
          </span>
          <span className="w-full truncate text-center text-xs">{live.user.userName}</span>
        </Link>
      ))}
      {stories.isPending ? (
        [1, 2, 3, 4].map((i) => (
          <div key={i} className="ig-story-item flex shrink-0 flex-col items-center gap-2" aria-hidden="true">
            <span className="ig-story-frame inline-flex p-[5px]">
              <Skeleton className="ig-story-avatar rounded-full" />
            </span>
            <Skeleton className="h-4 w-12" />
          </div>
        ))
      ) : stories.isError ? (
        <button
          className="text-xs text-ig-text-secondary"
          onClick={() => void stories.refetch()}
        >
          Retry stories
        </button>
      ) : (
        stories.data
          ?.filter((u) => u.stories.length > 0 && !liveUsers.has(u.userId) && u.userId !== me?.userId)
          .map((u) => (
            <Link
              key={u.userId}
              aria-label={u.userName}
              href={`/stories/${encodeURIComponent(u.userName)}`}
              className="ig-story-item flex shrink-0 flex-col items-center gap-2"
            >
              <StoryRing className="ig-story-frame" state={u.hasUnseen ? u.hasCloseFriends ? "close-friends" : "unseen" : "seen"}>
                <SmallAvatar
                  src={mediaUrl(u.userImage)}
                  name={u.userName}
                  className="ig-story-avatar"
                />
              </StoryRing>
              <span className="w-full truncate text-center text-xs">
                {u.userName}
              </span>
            </Link>
          ))
      )}
    </section>
  );
}
