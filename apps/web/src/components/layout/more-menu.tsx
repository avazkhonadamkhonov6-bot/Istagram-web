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
import { Bookmark, Menu, Settings } from "@/components/ui/icons";
import { CURRENT_USERNAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MoreMenu({ compact }: { compact: boolean }) {
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
          <Link href={`/${CURRENT_USERNAME}/saved`}>
            <Bookmark className="size-5" />
            Saved
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Выход подключим вместе с авторизацией (FE-06 / FE-14) */}
        <DropdownMenuItem destructive>
          <LogOut className="size-5" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}