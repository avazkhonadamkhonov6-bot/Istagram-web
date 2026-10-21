"use client";

import { formatCount } from "@/lib/format";
import { useTagInfo } from "../hooks";
import { ExploreGrid } from "./explore-grid";

export function TagView({ tag }: { tag: string }) {
  const { data: info } = useTagInfo(tag);

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6 md:pt-8">
      <header className="flex items-center gap-6 pb-8 md:gap-10 md:px-10">
        <div
          aria-hidden
          className="flex size-20 shrink-0 items-center justify-center rounded-full border border-ig-separator text-3xl md:size-[150px] md:text-6xl"
        >
          #
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">#{tag}</h1>
          <p className="mt-1 text-sm text-ig-text-secondary">
            <span className="font-semibold text-ig-text">
              {info ? formatCount(info.postsCount) : "—"}
            </span>{" "}
            posts
          </p>
        </div>
      </header>
      <div className="border-t border-ig-separator pt-1">
        <ExploreGrid tag={tag} />
      </div>
    </div>
  );
}