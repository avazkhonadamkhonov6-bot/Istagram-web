"use client";

import type { Suggestion } from "@repo/shared";
import Link from "next/link";
import { useState } from "react";
import { SwitchAccountsDialog } from "@/features/auth/components/switch-accounts-dialog";
import { useMe } from "@/features/auth/hooks";
import { mediaUrl } from "@/lib/media";
import { useFollow, useSuggestions } from "../hooks";
import { SmallAvatar } from "./small-avatar";

const FOOTER_LINKS = [
  "About",
  "Help",
  "Press",
  "API",
  "Jobs",
  "Privacy",
  "Terms",
  "Locations",
  "Language",
  "Meta Verified",
];

function SuggestedRow({ user }: { user: Suggestion }) {
  const follow = useFollow();

  return (
    <li className="flex items-center gap-3 py-2">
      <Link href={`/${user.userName}`} aria-label={`Profile of ${user.userName}`} className="shrink-0">
        <SmallAvatar
          src={mediaUrl(user.avatar)}
          name={user.userName}
          className="size-11"
        />
      </Link>
      <div className="min-w-0 flex-1 text-sm leading-[18px]">
        <Link
          href={`/${user.userName}`}
          className="block truncate font-semibold"
        >
          {user.userName}
        </Link>
        <span className="block truncate text-xs text-ig-text-secondary">
          {user.fullName || "Suggested for you"}
        </span>
      </div>
      <button
        type="button"
        disabled={follow.isPending || follow.isSuccess}
        onClick={() => follow.mutate(user.id)}
        className="text-xs font-semibold text-[rgb(var(--ig-colors-button-borderless-text))] hover:text-[rgb(var(--ig-link))] disabled:text-ig-text-secondary"
      >
        {follow.isSuccess ? follow.data.isRequested ? "Requested" : "Following" : "Follow"}
      </button>
    </li>
  );
}

export function SuggestedSidebar() {
  const { data } = useSuggestions();
  const { data: me } = useMe();
  const [switchOpen, setSwitchOpen] = useState(false);

  return (
    <section aria-label="Suggested for you" className="w-full min-w-0">
      {me ? (
        <div className="mb-4 flex items-center gap-3">
          <Link href={`/${me.userName}`} aria-label={`Profile of ${me.userName}`} className="shrink-0">
            <SmallAvatar
              src={mediaUrl(me.image)}
              name={me.userName}
              className="size-11"
            />
          </Link>
          <div className="min-w-0 flex-1 text-sm leading-[18px]">
            <Link href={`/${me.userName}`} className="block truncate font-semibold">
              {me.userName}
            </Link>
            <span className="block truncate text-ig-text-secondary">
              {me.fullName ?? ""}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSwitchOpen(true)}
            className="text-xs font-semibold text-[rgb(var(--ig-colors-button-borderless-text))] hover:text-[rgb(var(--ig-link))]"
          >
            Switch
          </button>
        </div>
      ) : null}
      <SwitchAccountsDialog open={switchOpen} onOpenChange={setSwitchOpen} />

      <div className="mb-1 flex items-center justify-between py-1">
        <h2 className="text-sm font-semibold text-ig-text-secondary">
          Suggested for you
        </h2>
        <Link href="/explore" className="text-xs font-semibold text-ig-text hover:text-ig-text-secondary">
          See All
        </Link>
      </div>
      <ul className="ig-suggested-users">
        {(data ?? []).slice(0, 5).map((user) => (
          <SuggestedRow key={user.id} user={user} />
        ))}
      </ul>

      <footer className="mt-6 text-xs leading-4 text-ig-text-secondary">
        <ul className="flex flex-wrap">
          {FOOTER_LINKS.map((label, i) => (
            <li key={label}>
              <span className="hover:underline">{label}</span>
              {i < FOOTER_LINKS.length - 1 ? <span aria-hidden className="mx-1">&middot;</span> : null}
            </li>
          ))}
        </ul>
        <p className="mt-4 uppercase">&copy; {new Date().getFullYear()} Instagram from Meta</p>
      </footer>
    </section>
  );
}
