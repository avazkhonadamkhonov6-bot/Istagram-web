"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StoryRing } from "@/components/ui/story-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { mediaUrl } from "@/lib/media";
import { useUiStore } from "@/store/ui.store";
import { getStories, storyKey } from "../api";
export function StoriesTray() {
  const stories = useQuery({ queryKey: storyKey, queryFn: getStories });
  const { data: me } = useMe();
  const create = useUiStore((s) => s.setCreateOpen);
  return (
    <section
      aria-label="Stories"
      className="no-scrollbar -mx-2 mb-5 flex gap-4 overflow-x-auto px-2 py-2"
    >
      <button
        onClick={() => create(true)}
        className="flex w-[66px] shrink-0 flex-col items-center gap-2"
        aria-label="Your story"
      >
        <span className="relative p-[5px]">
          <SmallAvatar
            src={mediaUrl(me?.image)}
            name={me?.userName ?? "You"}
            className="size-14"
          />
          <Plus className="absolute bottom-0 right-0 size-5 rounded-full border-2 border-ig-bg bg-ig-primary text-ig-text-on-color" />
        </span>
        <span className="text-xs text-ig-text-secondary">Your story</span>
      </button>
      {stories.isPending ? (
        [1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="size-[66px] shrink-0 rounded-full" />
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
          ?.filter((u) => u.stories.length > 0)
          .map((u) => (
            <Link
              key={u.userId}
              aria-label={u.userName}
              href={`/stories/${encodeURIComponent(u.userName)}`}
              className="flex w-[66px] shrink-0 flex-col items-center gap-2"
            >
              <StoryRing state={u.hasUnseen ? "unseen" : "seen"}>
                <SmallAvatar
                  src={mediaUrl(u.userImage)}
                  name={u.userName}
                  className="size-14"
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
