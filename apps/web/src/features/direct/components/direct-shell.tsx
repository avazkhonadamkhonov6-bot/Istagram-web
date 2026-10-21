"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useDirectRealtime } from "../hooks";
import { ChatList } from "./chat-list";

/** Chap — ruyxati suhbatho (397px), rost — chat. Dar mobil faqat yake. */
export function DirectShell({ children }: { children: ReactNode }) {
  const params = useParams<{ id?: string }>();
  const activeId = params.id ? Number(params.id) : null;
  useDirectRealtime(activeId);

  return (
    <div className="flex h-[calc(100dvh-110px)] md:h-dvh">
      <ChatList className={cn("w-full md:w-[397px] md:shrink-0", activeId !== null && "hidden md:flex")} />
      <div className={cn("min-w-0 flex-1", activeId === null && "hidden md:flex")}>{children}</div>
    </div>
  );
}
