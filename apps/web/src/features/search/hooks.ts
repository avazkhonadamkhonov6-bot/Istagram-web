"use client";

import type { UserShort } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import * as searchApi from "./api";

export const searchKeys = {
  users: (q: string) => ["search", "users", q] as const,
  tags: (q: string) => ["search", "tags", q] as const,
  recentUsers: ["search", "recent", "users"] as const,
  recentTags: ["search", "recent", "tags"] as const,
};

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useUserSearch(q: string, enabled: boolean) {
  return useQuery({
    queryKey: searchKeys.users(q),
    queryFn: () => searchApi.searchUsers(q),
    enabled,
  });
}

export function useHashtagSearch(q: string, enabled: boolean) {
  const name = q.replace(/^#/, "");
  return useQuery({
    queryKey: searchKeys.tags(name),
    queryFn: () => searchApi.searchHashtags(name),
    enabled,
  });
}

export type RecentItem = { key: string; createdAt: string } & (
  | { kind: "user"; id: number; user: UserShort }
  | { kind: "tag"; id: number; name: string }
);

export function useRecent() {
  const users = useQuery({
    queryKey: searchKeys.recentUsers,
    queryFn: searchApi.getRecentUsers,
  });
  const texts = useQuery({
    queryKey: searchKeys.recentTags,
    queryFn: searchApi.getRecentTexts,
  });

  const items: RecentItem[] = [
    ...(users.data ?? []).map(
      (h): RecentItem => ({
        key: `u${h.id}`,
        kind: "user",
        id: h.id,
        createdAt: h.createdAt,
        user: h.users,
      }),
    ),
    ...(texts.data ?? [])
      .filter((h) => h.text.startsWith("#"))
      .map(
        (h): RecentItem => ({
          key: `t${h.id}`,
          kind: "tag",
          id: h.id,
          createdAt: h.createdAt,
          name: h.text.slice(1),
        }),
      ),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { items, isPending: users.isPending || texts.isPending };
}

type Visit = { kind: "user"; id: string } | { kind: "tag"; name: string };

export function useRecordSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Visit) => {
      if (v.kind === "user") await searchApi.addUserHistory(v.id);
      else await searchApi.addTextHistory(`#${v.name}`);
    },
    onSuccess: (_data, v) =>
      qc.invalidateQueries({
        queryKey:
          v.kind === "user" ? searchKeys.recentUsers : searchKeys.recentTags,
      }),
  });
}

export function useRemoveRecent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: RecentItem) =>
      item.kind === "user"
        ? searchApi.deleteUserHistory(item.id)
        : searchApi.deleteTextHistory(item.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search", "recent"] }),
  });
}

export function useClearRecent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      Promise.all([
        searchApi.clearUserHistories(),
        searchApi.clearTextHistories(),
      ]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search", "recent"] }),
  });
}