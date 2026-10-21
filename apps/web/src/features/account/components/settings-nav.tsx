"use client";

import { useUiStore } from "@/store/ui.store";
import { Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/accounts/edit", label: "Edit profile" },
  { href: "/accounts/password", label: "Change password" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings"
      className="flex flex-wrap gap-2 border-b border-ig-separator pb-3 md:w-[240px] md:shrink-0 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-2"
    >
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={pathname === l.href ? "page" : undefined}
          className={cn(
            "rounded-lg px-4 py-3 text-sm hover:bg-ig-hover-overlay",
            pathname === l.href ? "font-semibold" : "text-ig-text-secondary",
          )}
        >
          {l.label}
        </Link>
      ))}
      <button
        onClick={() => useUiStore.getState().toggleTheme()}
        className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm hover:bg-ig-hover-overlay"
      >
        <Moon className="size-4" />
        Switch appearance
      </button>
    </nav>
  );
}
