"use client";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { Feed } from "./feed";

export function HomeFeed() {
  const mode = useUiStore((s) => s.feedMode);
  const setMode = useUiStore((s) => s.setFeedMode);
  return <>
    <div role="tablist" aria-label="Feed" className="ig-feed-tabs mb-4 flex gap-5 border-b border-ig-separator">
      {(["following", "favorites"] as const).map((kind) => <button key={kind} role="tab" aria-selected={mode === kind} onClick={() => setMode(kind)} className={cn("border-b-2 py-3 text-base font-semibold capitalize", mode === kind ? "border-ig-text" : "border-transparent text-ig-text-secondary")}>{kind}</button>)}
    </div>
    <div className="ig-feed-posts"><Feed key={mode} mode={mode} /></div>
  </>;
}
