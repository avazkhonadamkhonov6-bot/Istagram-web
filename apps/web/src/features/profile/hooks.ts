"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getUserReels, getFollowStatus } from "@/features/social/api";
import type { UserProfile } from "@repo/shared";
import { toast } from "@/components/ui/toast";
import * as profileApi from "./api";

export type GridKind = "posts" | "saved" | "reels";
export type FollowListKind = "followers" | "following";

export const profileKeys = {
  byName: (username: string) => ["profile", username.toLowerCase()] as const,
  followStatus: (id: string) => ["follow-status", id] as const,
  isFollow: (id: string) => ["is-follow", id] as const,
  grid: (kind: GridKind, id: string) => ["profile-grid", kind, id] as const,
  list: (kind: FollowListKind, id: string) =>
    ["follow-list", kind, id] as const,
};

export function useProfile(username: string, initialData?: UserProfile) {
  return useQuery({
    initialData,
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
        : kind === "reels"
          ? getUserReels(userId, pageParam)
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

export function useFollowStatus(userId: string, enabled = true) {
  return useQuery({ queryKey: profileKeys.followStatus(userId), queryFn: () => getFollowStatus(userId), enabled });
}

export function useToggleFollow(profile: UserProfile) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currentlyFollowing: boolean) =>
      currentlyFollowing
        ? profileApi.unfollowUser(profile.userId)
        : profileApi.followUser(profile.userId),
    onMutate: async (currentlyFollowing) => {
      await qc.cancelQueries({
        queryKey: profileKeys.byName(profile.userName),
      });
      await qc.cancelQueries({
        queryKey: profileKeys.isFollow(profile.userId),
      });
      const previousProfile = qc.getQueryData(
        profileKeys.byName(profile.userName),
      );
      const previousFollowing = qc.getQueryData(
        profileKeys.isFollow(profile.userId),
      );
      qc.setQueryData(
        profileKeys.isFollow(profile.userId),
        !currentlyFollowing,
      );
      qc.setQueryData<UserProfile>(
        profileKeys.byName(profile.userName),
        (old) =>
          old
            ? {
                ...old,
                subscribersCount: Math.max(
                  0,
                  old.subscribersCount + (currentlyFollowing ? -1 : 1),
                ),
              }
            : old,
      );
      return { previousProfile, previousFollowing };
    },
    onError: (_error, _following, context) => {
      toast.error("Could not update following. Try again.");
      if (context) {
        qc.setQueryData(
          profileKeys.byName(profile.userName),
          context.previousProfile,
        );
        qc.setQueryData(
          profileKeys.isFollow(profile.userId),
          context.previousFollowing,
        );
      }
    },
    onSuccess: (res) => {
      qc.setQueryData(profileKeys.isFollow(profile.userId), res.isFollowing);
      qc.setQueryData(profileKeys.followStatus(profile.userId), res.isRequested ? "requested" : res.isFollowing ? "following" : "none");
      void qc.invalidateQueries({ queryKey: ["feed"] });
      qc.setQueryData<UserProfile | null>(
        profileKeys.byName(profile.userName),
        (old) =>
          old ? { ...old, subscribersCount: res.subscribersCount } : old,
      );
    },
  });
}
