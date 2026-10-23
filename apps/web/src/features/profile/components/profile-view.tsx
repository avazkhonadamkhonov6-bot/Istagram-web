"use client";

import type { HighlightDto, PostDto, UserProfile } from "@repo/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createChat } from "@/features/direct/api";
import { toast } from "@/components/ui/toast";

import {
  Bookmark,
  Grid3X3,
  Clapperboard,
  Contact,
  LockKeyhole,
  Settings,
} from "lucide-react";
import { AuthFooter } from "@/features/auth/components/auth-presentation";
import { Highlights } from "./highlights";
import { ProfileActions } from "./profile-actions";
import { CollectionsBrowser } from "@/features/collections/components/collections-browser";
import { useLives } from "@/features/live-entry/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { formatCount } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useFollowStatus, useProfile, useToggleFollow } from "../hooks";
import { FollowListModal } from "./follow-list-modal";
import { PostGrid } from "./post-grid";

type Tab = "posts" | "reels" | "saved" | "tagged";

const TABS: { key: Tab; label: string }[] = [
  { key: "posts", label: "POSTS" },
  { key: "reels", label: "REELS" },
  { key: "saved", label: "SAVED" },
  { key: "tagged", label: "TAGGED" },
];

function FollowButton({ profile }: { profile: UserProfile }) {
  const { data: status, isPending } = useFollowStatus(profile.userId);
  const toggle = useToggleFollow(profile);
  const isFollowing = status === "following";
  const requested = status === "requested";

  return (
    <Button
      type="button"
      variant={isFollowing || requested ? "secondary" : "primary"}
      disabled={toggle.isPending || isPending}
      onClick={() => toggle.mutate(isFollowing || requested)}
      className="px-6"
    >
      {requested ? "Requested" : isFollowing ? "Following" : "Follow"}
    </Button>
  );
}

function MessageButton({ userId }: { userId: string }) {
  const router = useRouter();
  const chat = useMutation({
    mutationFn: () => createChat(userId),
    onSuccess: (id) => router.push(`/direct/t/${id}`),
    onError: () => toast.error("Could not open messages. Try again."),
  });
  return (
    <Button
      variant="secondary"
      disabled={chat.isPending}
      onClick={() => chat.mutate()}
    >
      Message
    </Button>
  );
}

function ProfilePosts({
  profile,
  tab,
  isSelf,
  initialPosts,
}: {
  profile: UserProfile;
  tab: Tab;
  isSelf: boolean;
  initialPosts?: PostDto[];
}) {
  const status = useFollowStatus(profile.userId, profile.isPrivate && !isSelf);
  if (profile.isPrivate && !isSelf) {
    if (status.isPending)
      return (
        <div className="py-12 text-center text-ig-text-secondary">
          Loading profile…
        </div>
      );
    if (status.isError)
      return (
        <div className="py-12 text-center">
          <Button variant="borderless" onClick={() => void status.refetch()}>
            Retry access check
          </Button>
        </div>
      );
    if (status.data !== "following")
      return (
        <div className="py-16 text-center">
          <LockKeyhole aria-hidden className="mx-auto mb-4 size-10" />
          <h2 className="font-semibold">This account is private</h2>
          <p className="mt-2 text-sm text-ig-text-secondary">
            Follow this account to see their photos and videos.
          </p>
        </div>
      );
  }
  return (
    <PostGrid
      isSelf={isSelf}
      key={tab}
      kind={tab}
      userId={profile.userId}
      initialPosts={initialPosts}
      filter={tab === "posts" || tab === "reels" ? tab : undefined}
    />
  );
}

export function ProfileView({
  username,
  modal,
  initialTab = "posts",
  initialProfile,
  initialIsSelf,
  initialHighlights,
  initialPosts,
}: {
  username: string;
  modal?: "followers" | "following";
  initialTab?: Tab;
  initialProfile?: UserProfile;
  initialIsSelf?: boolean;
  initialHighlights?: HighlightDto[];
  initialPosts?: PostDto[];
}) {
  const {
    data: profile,
    isPending,
    isError,
    refetch,
  } = useProfile(username, initialProfile);
  const { data: me } = useMe();
  const tab = initialTab;
  const lives = useLives();

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

  if (isError)
    return (
      <div className="py-24 text-center">
        <p>Could not load this profile.</p>
        <Button variant="borderless" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );

  if (!profile) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-semibold">
          Sorry, this page isn&apos;t available.
        </h1>
        <p className="mt-2 text-sm text-ig-text-secondary">
          The link you followed may be broken, or the page may have been
          removed.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-ig-link-action"
        >
          Go back to Instagram
        </Link>
      </div>
    );
  }

  const isSelf = me ? me.userId === profile.userId : (initialIsSelf ?? false);
  const tabs = isSelf ? TABS : TABS.filter((t) => t.key !== "saved");
  const live = lives.data?.find((l) => l.user.id === profile.userId);
  if (tab === "saved" && !isSelf)
    return <div className="py-24 text-center">Saved posts are private.</div>;
  const base = `/${profile.userName}`;

  return (
    <div className="ig-profile-page">
      <header className="ig-profile-header">
        <div className="relative shrink-0">
          <SmallAvatar
            src={mediaUrl(profile.image)}
            name={profile.userName}
            className="size-20 text-4xl md:size-[150px]"
          />
          {live && (
            <Link
              aria-label={`${profile.userName} is live`}
              href={`/live/${live.liveId}`}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded border-2 border-ig-bg bg-ig-badge px-2 text-xs font-bold text-ig-text-on-color"
            >
              LIVE
            </Link>
          )}
        </div>
        <div className="ig-profile-info min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold">{profile.userName}</h1>
            {isSelf && (
              <Link href="/accounts/edit" aria-label="Settings">
                <Settings className="size-6" />
              </Link>
            )}
            {isSelf ? null : (
              <>
                <FollowButton profile={profile} />
                <MessageButton userId={profile.userId} />
                <ProfileActions profile={profile} />
              </>
            )}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm md:gap-8 md:text-base">
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
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-ig-link-action"
              >
                {profile.website}
              </a>
            )}
            {profile.about ? (
              <p className="whitespace-pre-wrap break-words">{profile.about}</p>
            ) : null}
          </div>
        </div>
      </header>
      {isSelf && (
        <div className="ig-profile-actions">
          <Link href="/accounts/edit">Edit profile</Link>
          <Link href="/accounts/archive">View archive</Link>
        </div>
      )}
      <Highlights
        userId={profile.userId}
        isSelf={isSelf}
        initialData={initialHighlights}
      />

      <div
        role="tablist"
        className="ig-profile-tabs flex justify-center border-b border-ig-separator"
      >
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "posts" ? base : `${base}/${t.key}`}
            role="tab"
            aria-selected={tab === t.key}
            className={cn(
              "-mb-px flex items-center gap-2 min-w-0 flex-1 justify-center border-b-2 px-2 py-4 text-xs sm:flex-none sm:px-5 font-semibold tracking-widest",
              tab === t.key
                ? "border-ig-text text-ig-text"
                : "border-transparent text-ig-text-secondary",
            )}
          >
            {t.key === "posts" ? (
              <Grid3X3 className="size-6" />
            ) : t.key === "saved" ? (
              <Bookmark className="size-6" />
            ) : t.key === "tagged" ? (
              <Contact className="size-6" />
            ) : (
              <Clapperboard className="size-6" />
            )}
            <span className="sr-only">{t.label}</span>
          </Link>
        ))}
      </div>

      {tab === "saved" && isSelf && <CollectionsBrowser />}
      <ProfilePosts
        key={tab}
        profile={profile}
        tab={tab}
        isSelf={isSelf}
        initialPosts={initialPosts}
      />

      <AuthFooter />
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
