"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostDto, UserShort } from "@repo/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUserSearch } from "@/features/search/hooks";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Play } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { directKeys, useMe } from "@/features/direct/hooks";
import { ApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import {
  PAGE_SIZE,
  acceptRequest,
  declineRequest,
  getArchived,
  getFollowRequests,
  getLikedPosts,
  getRelationList,
  getStoryArchive,
  relationAction,
  updatePrivacy,
  type RelationAction,
  type RelationList,
} from "../api";

/** Sahifahoi "Privacy and security" (Spec 14 §7, `/accounts/*`) */
const LINKS = [
  { href: "/accounts/privacy", label: "Account privacy" },
  { href: "/accounts/close-friends", label: "Close friends" },
  { href: "/accounts/favorites", label: "Favorites" },
  { href: "/accounts/blocked", label: "Blocked" },
  { href: "/accounts/restricted", label: "Restricted accounts" },
  { href: "/accounts/muted", label: "Muted accounts" },
  { href: "/accounts/archive", label: "Archive" },
  { href: "/accounts/activity", label: "Your activity" },
];

export function PrivacyNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Privacy" className="-mx-1 [scrollbar-width:none] mb-6 flex gap-1 overflow-x-auto border-b border-ig-separator pb-3">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={pathname === l.href ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-lg px-3 py-2 text-sm hover:bg-ig-hover-overlay",
            pathname === l.href ? "bg-ig-bg-highlight font-semibold" : "text-ig-text-secondary",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-[rgb(var(--ig-toggle-background-on-prism))]" : "bg-[rgb(var(--ig-toggle-background-off-prism))]",
        disabled && "opacity-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0.5 size-5 rounded-full bg-ig-bg-primary transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function UserRow({ user, children }: { user: UserShort; children?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <Link href={`/${user.userName}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={mediaUrl(user.avatar)} alt={user.userName} size={44} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{user.userName}</span>
          {user.fullName && <span className="block truncate text-sm text-ig-text-secondary">{user.fullName}</span>}
        </span>
      </Link>
      {children}
    </li>
  );
}

function RowsSkeleton() {
  return (
    <ul>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </li>
      ))}
    </ul>
  );
}

/** Hisobi private + darxosthoi follow (Spec 14 §1.1) */
export function PrivacySettings() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [isPrivate, setIsPrivate] = useState<boolean | null>(null);
  const value = isPrivate ?? me?.isPrivate ?? false;
  const requests = useQuery({ queryKey: ["follow-requests"], queryFn: getFollowRequests });

  const privacy = useMutation({
    mutationFn: updatePrivacy,
    onMutate: (v) => setIsPrivate(v),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: directKeys.me });
      void qc.invalidateQueries({ queryKey: ["follow-requests"] });
    },
    onError: () => {
      setIsPrivate(null);
      toast.error("Couldn't update privacy");
    },
  });

  const answer = useMutation({
    mutationFn: ({ userId, accept }: { userId: string; accept: boolean }) => (accept ? acceptRequest(userId) : declineRequest(userId)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["follow-requests"] }),
    onError: () => toast.error("Something went wrong"),
  });

  return (
    <section>
      <h1 className="mb-6 text-xl font-bold">Account privacy</h1>
      <div className="flex items-center justify-between gap-6 rounded-xl border border-ig-separator p-4">
        <span className="text-base">Private account</span>
        <Toggle checked={value} onChange={(v) => privacy.mutate(v)} label="Private account" disabled={!me || privacy.isPending} />
      </div>
      <p className="mt-3 text-xs text-ig-text-secondary">
        When your account is public, your profile and posts can be seen by anyone. When your account is private, only the
        followers you approve can see what you share, including your photos or videos, followers and following lists.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold">Follow requests</h2>
      {requests.isPending ? (
        <RowsSkeleton />
      ) : requests.data?.length ? (
        <ul>
          {requests.data.map((u) => (
            <UserRow key={u.id} user={u}>
              <Button size="sm" onClick={() => answer.mutate({ userId: u.id, accept: true })}>
                Confirm
              </Button>
              <Button size="sm" variant="secondary" onClick={() => answer.mutate({ userId: u.id, accept: false })}>
                Delete
              </Button>
            </UserRow>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ig-text-secondary">No pending requests.</p>
      )}
    </section>
  );
}

const LIST_COPY: Record<RelationList, { title: string; empty: string; hint: string; remove: string; undo: RelationAction }> = {
  blocked: {
    title: "Blocked accounts",
    empty: "You haven't blocked anyone.",
    hint: "They won't be able to find your profile, posts or story. They won't be notified that you blocked them.",
    remove: "Unblock",
    undo: "unblock",
  },
  muted: {
    title: "Muted accounts",
    empty: "You haven't muted anyone.",
    hint: "Muted accounts' posts and stories won't appear in your feed. They won't know you've muted them.",
    remove: "Unmute",
    undo: "unmute",
  },
  restricted: {
    title: "Restricted accounts",
    empty: "You haven't restricted anyone.",
    hint: "Protect yourself from unwanted interactions without having to block or unfollow people you know.",
    remove: "Unrestrict",
    undo: "unrestrict",
  },
  "close-friends": {
    title: "Close friends",
    empty: "You haven't added anyone to your close friends list.",
    hint: "Only people on this list can see stories you share with close friends. They won't be notified.",
    remove: "Remove",
    undo: "remove-close-friend",
  },
  favorites: {
    title: "Favorites",
    empty: "You haven't added anyone to Favorites.",
    hint: "Posts from your favorites appear higher in feed and in the Favorites feed. They won't be notified. Up to 50 accounts.",
    remove: "Remove",
    undo: "remove-favorite",
  },
};

/** Ruyxathoi block / mute / restrict / close friends (Spec 14 §1.2–1.6), favorites (Spec 15 §1) */
export function RelationListView({ kind }: { kind: RelationList }) {
  const qc = useQueryClient();
  const copy = LIST_COPY[kind];
  const key = ["relation-list", kind] as const;
  const { data, isPending } = useQuery({ queryKey: key, queryFn: () => getRelationList(kind) });

  const undo = useMutation({
    mutationFn: (userId: string) => relationAction(copy.undo, userId),
    onSuccess: (_r, userId) => {
      qc.setQueryData<UserShort[]>(key, (old) => old?.filter((u) => u.id !== userId));
      void qc.invalidateQueries({ queryKey: ["relation", userId] });
    },
    onError: () => toast.error("Something went wrong"),
  });

  return (
    <section>
      <h1 className="mb-2 text-xl font-bold">{copy.title}</h1>
      <p className="mb-4 text-sm text-ig-text-secondary">{copy.hint}</p>
      {(kind === "close-friends" || kind === "favorites") && <AddToList kind={kind} />}
      {isPending ? (
        <RowsSkeleton />
      ) : data?.length ? (
        <ul>
          {data.map((u) => (
            <UserRow key={u.id} user={u}>
              <Button size="sm" variant="secondary" disabled={undo.isPending && undo.variables === u.id} onClick={() => undo.mutate(u.id)}>
                {copy.remove}
              </Button>
            </UserRow>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-ig-text-secondary">{copy.empty}</p>
      )}
    </section>
  );
}


function AddToList({ kind }: { kind: "close-friends" | "favorites" }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const search = useUserSearch(term, term.length > 0);
  const add = useMutation({
    mutationFn: (userId: string) => relationAction(kind === "favorites" ? "add-favorite" : "add-close-friend", userId),
    onSuccess: () => {
      setQ("");
      void qc.invalidateQueries({ queryKey: ["relation-list", kind] });
    },
    onError: (e) => toast.error(e instanceof ApiError && e.code === "FAVORITES_LIMIT" ? "You can add up to 50 favorites" : "Couldn't add"),
  });

  return (
    <div className="mb-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search"
        className="w-full rounded-lg bg-ig-bg-secondary px-4 py-2 text-sm outline-none placeholder:text-ig-input-placeholder"
      />
      {term && (
        <ul className="mt-2 border-b border-ig-separator pb-2">
          {search.isFetching && (
            <li className="flex justify-center py-2">
              <Spinner />
            </li>
          )}
          {search.data?.map((u) => (
            <UserRow key={u.id} user={u}>
              <Button size="sm" onClick={() => add.mutate(u.id)} disabled={add.isPending}>
                Add
              </Button>
            </UserRow>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Grid-i sodai postho bo infinite scroll (archive, location) */
export function PostTiles({ queryKey, fetchPage, empty }: { queryKey: readonly unknown[]; fetchPage: (page: number) => Promise<PostDto[]>; empty: string }) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.length < PAGE_SIZE ? undefined : all.length + 1),
  });
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="py-16 text-center text-sm text-ig-text-secondary">Couldn&apos;t load posts. Try again later.</p>;

  const items = data.pages.flat();
  if (items.length === 0) return <p className="py-16 text-center text-sm text-ig-text-secondary">{empty}</p>;

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {items.map((post) => {
          const file = post.images[0];
          const url = mediaUrl(file);
          return (
            <Link key={post.postId} href={`/p/${post.postId}`} className="relative block aspect-[3/4] overflow-hidden bg-ig-bg-secondary">
              {url && isVideoFile(file) ? (
                <video src={url} muted preload="metadata" className="size-full object-cover" />
              ) : url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={post.title || `Post by ${post.userName}`} loading="lazy" className="size-full object-cover" />
              ) : null}
              {post.isReel && <Play aria-hidden fill="currentColor" className="absolute right-2 top-2 size-5 text-ig-text-on-media" />}
            </Link>
          );
        })}
      </div>
      <div ref={sentinel} className="h-8" />
    </>
  );
}

/** Archive: postho va story-hoi guzashta (Spec 14 §2, §3) */
export function ArchiveView() {
  const [tab, setTab] = useState<"posts" | "stories">("posts");
  const stories = useQuery({ queryKey: ["story-archive"], queryFn: getStoryArchive, enabled: tab === "stories" });

  return (
    <section>
      <h1 className="mb-2 text-xl font-bold">Archive</h1>
      <p className="mb-4 text-sm text-ig-text-secondary">Only you can see your archived posts and stories.</p>
      <div role="tablist" className="mb-4 flex justify-center gap-12 border-t border-ig-separator text-xs font-semibold tracking-wider">
        {(["posts", "stories"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("-mt-px border-t py-4 uppercase", tab === t ? "border-ig-text text-ig-text" : "border-transparent text-ig-text-secondary")}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "posts" ? (
        <PostTiles queryKey={["archived-posts"]} fetchPage={getArchived} empty="No archived posts." />
      ) : stories.isPending ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[9/16]" />
          ))}
        </div>
      ) : stories.data?.length ? (
        <div className="grid grid-cols-3 gap-1">
          {stories.data.map((s) => {
            const url = mediaUrl(s.fileName);
            return (
              <div key={s.id} className="relative aspect-[9/16] overflow-hidden bg-ig-bg-secondary">
                {url && isVideoFile(s.fileName!) ? (
                  <video src={url} muted preload="metadata" className="size-full object-cover" />
                ) : url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="Story" loading="lazy" className="size-full object-cover" />
                ) : null}
                <time className="absolute left-2 top-2 rounded bg-ig-bg-primary px-1.5 py-0.5 text-[11px] font-semibold">
                  {formatRelativeTime(s.createAt)}
                </time>
                {s.closeFriends && <span aria-label="Close friends" className="absolute right-2 top-2 size-3 rounded-full bg-ig-close-friends" />}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-ig-text-secondary">No archived stories.</p>
      )}
    </section>
  );
}

/** "Your activity → Likes" (Spec 15 §6) */
export function ActivityView() {
  return (
    <section>
      <h1 className="mb-2 text-xl font-bold">Your activity</h1>
      <p className="mb-4 text-sm text-ig-text-secondary">Photos and videos you&apos;ve liked, newest first.</p>
      <PostTiles queryKey={["liked-posts"]} fetchPage={getLikedPosts} empty="When you like photos and videos, they'll appear here." />
    </section>
  );
}
