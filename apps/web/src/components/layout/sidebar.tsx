"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { MoreMenu } from "./more-menu";
import { NAV_ITEMS, isItemActive } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const panel = useUiStore((s) => s.panel);
  const togglePanel = useUiStore((s) => s.togglePanel);
  const closePanel = useUiStore((s) => s.closePanel);
  const setCreateOpen = useUiStore((s) => s.setCreateOpen);

  // Когда открыта панель Search / Notifications, sidebar сжимается до 72px
  const compact = panel !== null;
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
        className="mb-4 mt-6 flex h-10 items-center rounded-lg px-3 hover:bg-ig-hover-overlay"
      >
        <Camera className={cn("size-6", compact ? "" : "min-[1264px]:hidden")} />
        <span
          className={cn(
            "font-logo text-[28px] leading-none",
            compact ? "hidden" : "hidden min-[1264px]:inline",
          )}
        >
          Instagram
        </span>
      </Link>

      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item, pathname, panel);
          const Icon = item.icon;
          const rowCls = cn(
            "flex w-full items-center gap-4 rounded-lg p-3 text-base transition-colors hover:bg-ig-hover-overlay",
            active ? "font-semibold" : "font-normal",
          );
          const content = (
            <>
              <Icon
                className="size-6 shrink-0"
                strokeWidth={active ? 2.75 : 2}
                fill={active && item.fillWhenActive ? "currentColor" : "none"}
              />
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