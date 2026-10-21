"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
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

export function MoreMenu({ compact }: { compact: boolean }) {
  const { data: me } = useMe();
  const logoutMutation = useLogout();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const username = me?.userName ?? CURRENT_USERNAME;
  const labelCls = compact ? "hidden" : "hidden min-[1264px]:inline";

  return (
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
  );
}