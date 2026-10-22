"use client";

import type { UserShort } from "@repo/shared";
import Link from "next/link";
import { useState } from "react";
import { Search, X } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { formatCount } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { useUiStore } from "@/store/ui.store";
import {
  useClearRecent,
  useDebounced,
  useHashtagSearch,
  useRecent,
  useRecordSearch,
  useRemoveRecent,
  useUserSearch,
} from "../hooks";

function PersonRow({
  user,
  onOpen,
  onRemove,
}: {
  user: UserShort;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-6 py-2 hover:bg-ig-hover-overlay">
      <Link
        href={`/${user.userName}`}
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <SmallAvatar
          src={mediaUrl(user.avatar)}
          name={user.userName}
          className="size-11"
        />
        <div className="min-w-0 text-sm">
          <span className="block truncate font-semibold">{user.userName}</span>
          <span className="block truncate text-ig-text-secondary">
            {user.fullName}
          </span>
        </div>
      </Link>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${user.userName} from recent`}
          onClick={onRemove}
        >
          <X className="size-4 text-ig-text-secondary" />
        </button>
      ) : null}
    </li>
  );
}

function TagRow({
  name,
  postsCount,
  onOpen,
  onRemove,
}: {
  name: string;
  postsCount?: number;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-6 py-2 hover:bg-ig-hover-overlay">
      <Link
        href={`/explore/tags/${encodeURIComponent(name)}`}
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ig-separator text-lg"
        >
          #
        </span>
        <div className="min-w-0 text-sm">
          <span className="block truncate font-semibold">#{name}</span>
          {postsCount === undefined ? null : (
            <span className="block text-ig-text-secondary">
              {formatCount(postsCount)} posts
            </span>
          )}
        </div>
      </Link>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove #${name} from recent`}
          onClick={onRemove}
        >
          <X className="size-4 text-ig-text-secondary" />
        </button>
      ) : null}
    </li>
  );
}

export function SearchPanel() {
  const closePanel = useUiStore((s) => s.closePanel);
  const [query, setQuery] = useState("");
  const typed = query.trim();
  const q = useDebounced(typed, 300);

  const tagOnly = q.startsWith("#");
  const users = useUserSearch(q, q.length > 0 && !tagOnly);
  const tags = useHashtagSearch(q, q.replace(/^#/, "").length > 0);
  const recent = useRecent();
  const record = useRecordSearch();
  const removeRecent = useRemoveRecent();
  const clearRecent = useClearRecent();

  const openUser = (id: string) => {
    record.mutate({ kind: "user", id });
    closePanel();
  };
  const openTag = (name: string) => {
    record.mutate({ kind: "tag", name });
    closePanel();
  };

  const loading = typed !== q || users.isFetching || tags.isFetching;
  const userItems = tagOnly ? [] : (users.data ?? []);
  const tagItems = tags.data ?? [];
  const noResults =
    !loading && userItems.length === 0 && tagItems.length === 0;

  return (
    <div className="pb-4">
      <div className="px-4 pb-6">
        <label className="ig-search-field">
          <Search aria-hidden className="size-4 shrink-0 text-ig-text-secondary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && query && (e.stopPropagation(), setQuery(""))}
            placeholder="Search"
            aria-label="Search"
            enterKeyHint="search"
            className="ig-search-input"
          />
          {loading && typed ? (
            <span aria-hidden className="size-4 shrink-0 animate-spin rounded-full border-2 border-ig-text-secondary border-t-transparent" />
          ) : query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="flex size-4 shrink-0 items-center justify-center rounded-full bg-ig-text-tertiary text-ig-bg"
            >
              <X className="size-3" strokeWidth={3} />
            </button>
          ) : null}
        </label>
      </div>

      <div className="border-t border-ig-separator pt-3">
        {typed ? (
          <ul>
            {userItems.map((u) => (
              <PersonRow key={u.id} user={u} onOpen={() => openUser(u.id)} />
            ))}
            {tagItems.map((t) => (
              <TagRow
                key={t.name}
                name={t.name}
                postsCount={t.postsCount}
                onOpen={() => openTag(t.name)}
              />
            ))}
            {loading && userItems.length + tagItems.length === 0 ? (
              <li className="space-y-2 px-6">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </li>
            ) : null}
            {noResults ? (
              <li className="px-6 py-8 text-center text-sm text-ig-text-secondary">
                No results found.
              </li>
            ) : null}
          </ul>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pb-2">
              <h3 className="text-base font-semibold">Recent</h3>
              {recent.items.length > 0 ? (
                <button
                  type="button"
                  onClick={() => clearRecent.mutate()}
                  className="text-sm font-semibold text-ig-link-action"
                >
                  Clear all
                </button>
              ) : null}
            </div>
            <ul>
              {recent.items.map((item) =>
                item.kind === "user" ? (
                  <PersonRow
                    key={item.key}
                    user={item.user}
                    onOpen={() => openUser(item.user.id)}
                    onRemove={() => removeRecent.mutate(item)}
                  />
                ) : (
                  <TagRow
                    key={item.key}
                    name={item.name}
                    onOpen={() => openTag(item.name)}
                    onRemove={() => removeRecent.mutate(item)}
                  />
                ),
              )}
              {!recent.isPending && recent.items.length === 0 ? (
                <li className="px-6 py-8 text-center text-sm text-ig-text-secondary">
                  No recent searches.
                </li>
              ) : null}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}