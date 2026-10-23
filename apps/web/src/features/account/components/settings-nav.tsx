"use client";

import { useUiStore } from "@/store/ui.store";
import { Globe, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageDialog } from "@/components/language-dialog";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/accounts/edit", label: "Edit profile" },
  { href: "/accounts/password", label: "Change password" },
  { href: "/accounts/privacy", label: "Account privacy" },
  { href: "/accounts/blocked", label: "Blocked accounts" },
  { href: "/accounts/muted", label: "Muted accounts" },
  { href: "/accounts/restricted", label: "Restricted accounts" },
  { href: "/accounts/close-friends", label: "Close friends" },
  { href: "/accounts/favorites", label: "Favorites" },
  { href: "/accounts/activity", label: "Your activity" },
  { href: "/accounts/archive", label: "Archive" },
];

export function SettingsNav() {
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);

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
      <button
        onClick={() => setLangOpen(true)}
        className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm hover:bg-ig-hover-overlay"
      >
        <Globe className="size-4" />
        Language
      </button>
      <LanguageDialog open={langOpen} onOpenChange={setLangOpen} />
    </nav>
  );
}
