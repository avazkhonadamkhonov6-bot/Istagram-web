"use client";

import { MapPin } from "lucide-react";
import { getLocationPosts } from "../api";
import { PostTiles } from "./settings";

/** `/explore/locations/[name]` — posthoi yak location (Spec 14 §2) */
export function LocationView({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-[935px] px-4 py-6 md:pt-8">
      <header className="flex items-center gap-6 pb-8 md:gap-10 md:px-10">
        <div
          aria-hidden
          className="flex size-20 shrink-0 items-center justify-center rounded-full border border-ig-separator md:size-[150px]"
        >
          <MapPin className="size-8 text-ig-icon md:size-14" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{name}</h1>
          <p className="mt-1 text-sm text-ig-text-secondary">Top posts</p>
        </div>
      </header>
      <div className="border-t border-ig-separator pt-1">
        <PostTiles
          queryKey={["location-posts", name]}
          fetchPage={(page) => getLocationPosts(name, page)}
          empty="No posts from this location yet."
        />
      </div>
    </div>
  );
}
