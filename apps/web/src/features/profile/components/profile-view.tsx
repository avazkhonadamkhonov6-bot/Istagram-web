"use client";

import type { UserProfile } from "@repo/shared";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { formatCount } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useIsFollowing, useProfile, useToggleFollow } from "../hooks";
import { FollowListModal } from "./follow-list-modal";
import { PostGrid } from "./post-grid";

type Tab = "posts" | "reels" | "saved";

const TABS: { key: Tab; label: string }[] = [
  { key: "posts", label: "POSTS" },
  { key: "reels", label: "REELS" },
  { key: "saved", label: "SAVED" },
];

function FollowButton({ profile }: { profile: UserProfile }) {
  const { data: following } = useIsFollowing(profile.userId, true);
  const toggle = useToggleFollow(profile);
  const isFollowing = following === true;

  return (
    <Button
      type="button"
      variant={isFollowing ? "secondary" : "primary"}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate(isFollowing)}
      className="px-6"
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}

export function ProfileView({
  username,
  modal,
}: {
  username: string;
  modal?: "followers" | "following";
}) {
  const { data: profile, isPending } = useProfile(username);
  const { data: me } = useMe();
  const [tab, setTab] = useState<Tab>("posts");

  if (isPending) {
    return (
      <div className="mx-auto max-w-[935px] space-y-6 px-4 py-8">
        <div className="flex items-center gap-10">
          <Skeleton className="size-[150px] rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-semibold">
          Sorry, this page isn&apos;t available.
        </h1>
        <p className="mt-2 text-sm text-ig-text-secondary">
          The link you followed may be broken, or the page may have been removed.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-ig-link-action">
          Go back to Instagram
        </Link>
      </div>
    );
  }

  const isSelf = me?.userId === profile.userId;
  const tabs = isSelf ? TABS : TABS.slice(0, 2);
  const base = `/${profile.userName}`;

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6 md:pt-8">
      <header className="flex gap-6 pb-8 md:gap-20 md:px-10">
        <SmallAvatar
          src={mediaUrl(profile.image)}
          name={profile.userName}
          className="size-20 shrink-0 text-4xl md:size-[150px]"
        />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl">{profile.userName}</h1>
            {isSelf ? (
              <Link
                href="/accounts/edit"
                className="rounded-lg bg-ig-secondary px-4 py-1.5 text-sm font-semibold hover:bg-ig-secondary-hover"
              >
                Edit profile
              </Link>
            ) : (
              <FollowButton profile={profile} />
            )}
          </div>
          <ul className="flex gap-8 text-base">
            <li>
              <span className="font-semibold">
                {formatCount(profile.postCount)}
              </span>{" "}
              posts
            </li>
            <li>
              <Link href={`${base}/followers`}>
                <span className="font-semibold">
                  {formatCount(profile.subscribersCount)}
                </span>{" "}
                followers
              </Link>
            </li>
            <li>
              <Link href={`${base}/following`}>
                <span className="font-semibold">
                  {formatCount(profile.subscriptionsCount)}
                </span>{" "}
                following
              </Link>
            </li>
          </ul>
          <div className="text-sm">
            {profile.fullName ? (
              <p className="font-semibold">{profile.fullName}</p>
            ) : null}
            {profile.about ? (
              <p className="whitespace-pre-wrap break-words">{profile.about}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div role="tablist" className="flex justify-center gap-12 border-t border-ig-separator">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mt-px border-t py-4 text-xs font-semibold tracking-widest",
              tab === t.key
                ? "border-ig-text text-ig-text"
                : "border-transparent text-ig-text-secondary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <PostGrid
        key={tab}
        kind={tab === "saved" ? "saved" : "posts"}
        userId={profile.userId}
        filter={tab === "saved" ? undefined : tab}
      />

      {modal ? (
        <FollowListModal
          kind={modal}
          userId={profile.userId}
          username={profile.userName}
        />
      ) : null}
    </div>
  );
}