"use client";

import Link from "next/link";
import { AtSign, Grid2X2, LogOut, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Menu, Moon, Settings, Sun } from "@/components/ui/icons";
import { useLogout, useMe } from "@/features/auth/hooks";
import { CURRENT_USERNAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";

export function MoreMenu() {
  const { data: me } = useMe();
  const logoutMutation = useLogout();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const username = me?.userName ?? CURRENT_USERNAME;
  const labelCls = "ig-sidebar-label";

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="More"
          className="flex w-full items-center gap-4 rounded-lg p-3 text-base transition-colors hover:bg-ig-hover-overlay"
        >
          <Menu className="size-6 shrink-0" />
          <span className={cn(labelCls)}>More</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        {[
          ["/accounts/privacy", "Account privacy"],
          ["/accounts/favorites", "Favorites"],
          ["/accounts/activity", "Your activity"],
          ["/accounts/archive", "Archive"],
        ].map(([href, label]) => <DropdownMenuItem key={href} asChild><Link href={href}>{label}</Link></DropdownMenuItem>)}
        <DropdownMenuItem asChild>
          <Link href="/accounts/edit">
            <Settings className="size-5" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${username}/saved`}>
            <Bookmark className="size-5" />
            Saved
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
          Switch appearance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={() => logoutMutation.mutate()}
        >
          <LogOut className="size-5" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button type="button" aria-label="Other Meta products" className="mt-2 flex w-full items-center gap-4 rounded-lg p-3 text-base hover:bg-ig-hover-overlay"><Grid2X2 className="size-6 shrink-0" /><span className={cn(labelCls, "truncate")}>Other Meta products</span></button></DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuItem asChild><a href="https://www.whatsapp.com/" target="_blank" rel="noreferrer"><MessageCircle className="size-6" />WhatsApp</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href="https://www.threads.com/" target="_blank" rel="noreferrer"><AtSign className="size-6" />Threads</a></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}