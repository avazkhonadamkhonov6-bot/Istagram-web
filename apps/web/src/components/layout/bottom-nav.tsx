"use client";

import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { mediaUrl } from "@/lib/media";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/features/auth/hooks";
import { useDirectUnreadCount } from "@/features/direct/hooks";
import { CURRENT_USERNAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { BOTTOM_NAV_KEYS, NAV_ITEMS, isItemActive, type NavItem } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const { data: me } = useMe();
  const panel = useUiStore((s) => s.panel);
  const closePanel = useUiStore((s) => s.closePanel);
  const setCreateOpen = useUiStore((s) => s.setCreateOpen);

  const myUsername = me?.userName ?? CURRENT_USERNAME;
  const profileHref = `/${myUsername}`;
  const { data: unread } = useDirectUnreadCount();
  const items = BOTTOM_NAV_KEYS.map((key) => NAV_ITEMS.find((item) => item.key === key)!)
    // Dar telefon Search — sahifai /explore bo satri justuju (na paneli kanor)
    .map((item): NavItem =>
      item.key === "search"
        ? { ...item, kind: "link", href: "/explore", match: (p: string) => p.startsWith("/explore") }
        : item,
    );

  return (
    <nav
      aria-label="Primary"
      className="ig-bottom-nav fixed inset-x-0 bottom-0 z-40 flex h-[50px] items-center justify-around border-t border-ig-separator bg-ig-bg pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map((rawItem) => {
        const item =
          rawItem.key === "profile" && rawItem.kind === "link"
            ? {
                ...rawItem,
                href: profileHref,
                match: (p: string) =>
                  p === profileHref || p.startsWith(`${profileHref}/`),
              }
            : rawItem;

        const active = isItemActive(item, pathname, panel);
        const Icon = item.icon;
        const cls = cn(
          "relative flex h-full flex-1 items-center justify-center text-ig-icon",
        );
        const icon =
          item.key === "profile" ? (
            <SmallAvatar
              src={mediaUrl(me?.image)}
              name={myUsername}
              className={cn(
                "size-6",
                active && "ring-2 ring-ig-text ring-offset-2 ring-offset-ig-bg",
              )}
            />
          ) : (
            <>
              <Icon
                className="size-[26px]"
                strokeWidth={active ? 2.75 : 2}
                fill={active && item.fillWhenActive ? "currentColor" : "none"}
              />
              {item.key === "messages" && (unread?.count ?? 0) > 0 ? (
                <span className="ig-unread-count absolute left-1/2 top-1 ml-1">{unread!.count}</span>
              ) : null}
            </>
          );

        return item.kind === "link" ? (
          <Link
            key={item.key}
            href={item.href}
            onClick={closePanel}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cls}
          >
            {icon}
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            aria-label={item.label}
            onClick={() => setCreateOpen(true)}
            className={cls}
          >
            {icon}
          </button>
        );
      })}
    </nav>
  );
}
