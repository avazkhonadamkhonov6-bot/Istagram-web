"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import * as exploreApi from "./api";

export function useExploreFeed(tag?: string) {
  return useInfiniteQuery({
    queryKey: ["explore", tag ?? null] as const,
    queryFn: ({ pageParam }) =>
      tag
        ? exploreApi.getTagPosts(tag, pageParam)
        : exploreApi.getExplorePosts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.length < exploreApi.EXPLORE_PAGE_SIZE ? undefined : all.length + 1,
  });
}

export function useTagInfo(tag: string) {
  return useQuery({
    queryKey: ["hashtag", tag] as const,
    queryFn: () => exploreApi.getTagInfo(tag),
  });
}