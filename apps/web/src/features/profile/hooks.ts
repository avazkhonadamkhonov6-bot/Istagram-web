"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UserProfile } from "@repo/shared";
import * as profileApi from "./api";

export type GridKind = "posts" | "saved";
export type FollowListKind = "followers" | "following";

export const profileKeys = {
  byName: (username: string) => ["profile", username.toLowerCase()] as const,
  isFollow: (id: string) => ["is-follow", id] as const,
  grid: (kind: GridKind, id: string) => ["profile-grid", kind, id] as const,
  list: (kind: FollowListKind, id: string) =>
    ["follow-list", kind, id] as const,
};

export function useProfile(username: string) {
  return useQuery({
    queryKey: profileKeys.byName(username),
    queryFn: () => profileApi.getProfileByUsername(username),
  });
}

export function useIsFollowing(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.isFollow(userId),
    queryFn: () => profileApi.getIsFollowing(userId),
    enabled,
  });
}

export function useGridPosts(kind: GridKind, userId: string) {
  return useInfiniteQuery({
    queryKey: profileKeys.grid(kind, userId),
    queryFn: ({ pageParam }) =>
      kind === "saved"
        ? profileApi.getSavedPage(pageParam)
        : profileApi.getUserPosts(userId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.length < profileApi.GRID_PAGE_SIZE ? undefined : all.length + 1,
  });
}

export function useFollowList(kind: FollowListKind, userId: string) {
  return useQuery({
    queryKey: profileKeys.list(kind, userId),
    queryFn: () =>
      kind === "followers"
        ? profileApi.getSubscribers(userId)
        : profileApi.getSubscriptions(userId),
  });
}

export function useToggleFollow(profile: UserProfile) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currentlyFollowing: boolean) =>
      currentlyFollowing
        ? profileApi.unfollowUser(profile.userId)
        : profileApi.followUser(profile.userId),
    onSuccess: (res) => {
      qc.setQueryData(profileKeys.isFollow(profile.userId), res.isFollowing);
      qc.setQueryData<UserProfile | null>(
        profileKeys.byName(profile.userName),
        (old) =>
          old ? { ...old, subscribersCount: res.subscribersCount } : old,
      );
    },
  });
}