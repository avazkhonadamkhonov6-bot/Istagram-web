"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { mediaUrl } from "@/lib/media";
import { InstagramGlyph } from "@/components/ui/instagram-glyph";
import { useMe } from "@/features/auth/hooks";
import { useDirectUnreadCount } from "@/features/direct/hooks";
import { CURRENT_USERNAME } from "@/lib/constants";
import {
  useNotificationsRealtime,
  useNotificationsUnread,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { MoreMenu } from "./more-menu";
import { NAV_ITEMS, isItemActive } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { data: me } = useMe();
  const { data: notifUnread } = useNotificationsUnread();
  const { data: directUnread } = useDirectUnreadCount();
  useNotificationsRealtime();

  const panel = useUiStore((s) => s.panel);
  const togglePanel = useUiStore((s) => s.togglePanel);
  const closePanel = useUiStore((s) => s.closePanel);
  const setCreateOpen = useUiStore((s) => s.setCreateOpen);

  const myUsername = me?.userName ?? CURRENT_USERNAME;
  const profileHref = `/${myUsername}`;

  // Когда открыта панель Search / Notifications, sidebar сжимается до 72px
  const compact = panel !== null || pathname.startsWith("/direct");
  const labelCls = compact ? "hidden" : "hidden min-[1264px]:inline";

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-ig-separator bg-ig-bg px-3 pb-5 transition-[width] md:flex",
        compact ? "w-[72px]" : "w-[72px] min-[1264px]:w-[245px]",
      )}
    >
      <Link
        href="/"
        onClick={closePanel}
        aria-label="Instagram"
        className="mb-7 mt-7 flex h-10 items-center rounded-lg px-3 hover:bg-ig-hover-overlay"
      >
        <InstagramGlyph
          className={cn("size-6", compact ? "" : "min-[1264px]:hidden")}
        />
        <span className={cn("ig-wordmark w-[110px] h-10", compact ? "hidden" : "hidden min-[1264px]:inline-block")} aria-hidden />
      </Link>

      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((rawItem) => {
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
          const rowCls = cn(
            "ig-nav-item group flex w-full items-center gap-4 rounded-lg p-3 text-base transition-colors hover:bg-ig-hover-overlay",
            active ? "font-semibold" : "font-normal",
          );

          const hasBadge =
            (item.key === "notifications" && (notifUnread?.count ?? 0) > 0) ||
            (item.key === "messages" && (directUnread?.count ?? 0) > 0);

          const content = (
            <>
              <span className="relative inline-flex shrink-0">
                {item.key === "profile" ? (
                  <SmallAvatar
                    src={mediaUrl(me?.image)}
                    name={myUsername}
                    className={cn(
                      "size-6",
                      active &&
                        "ring-2 ring-ig-text ring-offset-2 ring-offset-ig-bg",
                    )}
                  />
                ) : (
                  <Icon
                    className="size-6 shrink-0 transition-transform duration-200 group-hover:scale-105"
                    strokeWidth={active ? 2.75 : 2}
                    fill={
                      active && item.fillWhenActive ? "currentColor" : "none"
                    }
                  />
                )}
                {hasBadge ? (
                  <span
                    aria-label="Unread"
                    className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-ig-badge ring-2 ring-ig-bg"
                  />
                ) : null}
              </span>
              <span className={labelCls}>{item.label}</span>
            </>
          );

          return (
            <li key={item.key}>
              {item.kind === "link" ? (
                <Link
                  href={item.href}
                  onClick={closePanel}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={rowCls}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  aria-label={item.label}
                  onClick={() =>
                    item.kind === "panel"
                      ? togglePanel(item.panel)
                      : setCreateOpen(true)
                  }
                  className={rowCls}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-auto">
        <MoreMenu compact={compact} />
      </div>
    </nav>
  );
}
