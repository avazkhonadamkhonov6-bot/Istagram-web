"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/features/auth/hooks";
import { CURRENT_USERNAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { BOTTOM_NAV_KEYS, NAV_ITEMS, isItemActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const { data: me } = useMe();
  const panel = useUiStore((s) => s.panel);
  const closePanel = useUiStore((s) => s.closePanel);
  const setCreateOpen = useUiStore((s) => s.setCreateOpen);

  const myUsername = me?.userName ?? CURRENT_USERNAME;
  const profileHref = `/${myUsername}`;
  const items = NAV_ITEMS.filter((item) => BOTTOM_NAV_KEYS.includes(item.key));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[50px] items-center justify-around border-t border-ig-separator bg-ig-bg md:hidden"
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
          "flex h-full flex-1 items-center justify-center",
          active ? "text-ig-text" : "text-ig-text-secondary",
        );
        const icon = (
          <Icon
            className="size-6"
            strokeWidth={active ? 2.75 : 2}
            fill={active && item.fillWhenActive ? "currentColor" : "none"}
          />
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