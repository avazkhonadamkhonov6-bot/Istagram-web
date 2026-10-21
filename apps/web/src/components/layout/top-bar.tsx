"use client";

import Link from "next/link";
import { Heart } from "@/components/ui/icons";
import { useUiStore } from "@/store/ui.store";

export function TopBar() {
  const panel = useUiStore((s) => s.panel);
  const togglePanel = useUiStore((s) => s.togglePanel);
  const closePanel = useUiStore((s) => s.closePanel);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[60px] items-center justify-between border-b border-ig-separator bg-ig-bg px-4 md:hidden">
      <Link
        href="/"
        onClick={closePanel}
        aria-label="Instagram"
        className="font-logo text-[28px] leading-none"
      >
        Instagram
      </Link>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => togglePanel("notifications")}
        className="rounded-lg p-2 hover:bg-ig-hover-overlay"
      >
        <Heart
          className="size-6"
          fill={panel === "notifications" ? "currentColor" : "none"}
        />
      </button>
    </header>
  );
}