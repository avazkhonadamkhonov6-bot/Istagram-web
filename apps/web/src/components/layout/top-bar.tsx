"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Star, Users } from "lucide-react";
import { Heart } from "@/components/ui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationsUnread } from "@/lib/notifications";
import { useUiStore } from "@/store/ui.store";

/**
 * Satri bolo-i mobil, misli instagram.com dar telefon: logotip bo menyui feed
 * (Following / Favorites) va dil bo nuqtai surx baroi notifications.
 * Search, Reels, Messages — dar satri poyon (BottomNav).
 */
export function TopBar() {
  const pathname = usePathname();
  const panel = useUiStore((s) => s.panel);
  const togglePanel = useUiStore((s) => s.togglePanel);
  const closePanel = useUiStore((s) => s.closePanel);
  const feedMode = useUiStore((s) => s.feedMode);
  const setFeedMode = useUiStore((s) => s.setFeedMode);
  const { data: unread } = useNotificationsUnread();
  const home = pathname === "/";

  return (
    <header className="ig-top-bar fixed inset-x-0 top-0 z-40 flex h-[60px] items-center justify-between bg-ig-bg pl-4 pr-2 md:hidden">
      {home ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Choose feed"
            className="flex items-center gap-1 rounded-lg py-1 pr-1 outline-none"
          >
            <span aria-hidden className="ig-wordmark block h-9 w-[104px]" />
            <ChevronDown className="size-5" strokeWidth={2.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onSelect={() => setFeedMode("following")}>
              <span className="flex flex-1 items-center gap-3">
                <Users className="size-5" />
                Following
              </span>
              {feedMode === "following" ? <span aria-hidden className="size-2 rounded-full bg-ig-primary" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFeedMode("favorites")}>
              <span className="flex flex-1 items-center gap-3">
                <Star className="size-5" />
                Favorites
              </span>
              {feedMode === "favorites" ? <span aria-hidden className="size-2 rounded-full bg-ig-primary" /> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link
          href="/"
          onClick={closePanel}
          aria-label="Instagram"
          className="ig-wordmark block h-9 w-[104px]"
        />
      )}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => togglePanel("notifications")}
        className="relative rounded-lg p-2"
      >
        <Heart
          className="size-[26px]"
          strokeWidth={2}
          fill={panel === "notifications" ? "currentColor" : "none"}
        />
        {(unread?.count ?? 0) > 0 ? (
          <span aria-label="New notifications" className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-ig-badge ring-2 ring-ig-bg" />
        ) : null}
      </button>
    </header>
  );
}
