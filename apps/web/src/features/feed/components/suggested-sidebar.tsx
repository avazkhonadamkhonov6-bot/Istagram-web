"use client";

import type { UserListItem } from "@repo/shared";
import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import { useFollow, useSuggestions } from "../hooks";
import { SmallAvatar } from "./small-avatar";

function SuggestedRow({ user }: { user: UserListItem }) {
  const follow = useFollow();

  return (
    <li className="flex items-center gap-3 py-2">
      <SmallAvatar
        src={mediaUrl(user.avatar)}
        name={user.userName}
        className="size-11"
      />
      <div className="min-w-0 flex-1 text-sm">
        <Link href={`/${user.userName}`} className="block truncate font-semibold">
          {user.userName}
        </Link>
        <span className="block truncate text-ig-text-secondary">
          {user.fullName}
        </span>
      </div>
      <button
        type="button"
        disabled={follow.isPending || follow.isSuccess}
        onClick={() => follow.mutate(user.id)}
        className="text-xs font-semibold text-ig-link-action disabled:text-ig-text-secondary"
      >
        {follow.isSuccess ? "Following" : "Follow"}
      </button>
    </li>
  );
}

export function SuggestedSidebar() {
  const { data } = useSuggestions();

  if (!data || data.length === 0) return null;

  return (
    <section aria-label="Suggested for you">
      <h2 className="mb-2 text-sm font-semibold text-ig-text-secondary">
        Suggested for you
      </h2>
      <ul>
        {data.slice(0, 5).map((user) => (
          <SuggestedRow key={user.id} user={user} />
        ))}
      </ul>
    </section>
  );
}