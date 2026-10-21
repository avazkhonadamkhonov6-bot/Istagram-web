"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { PostDto } from "@repo/shared";
import { favoritePost, likePost } from "@/features/feed/api";
import { feedKeys } from "@/features/feed/hooks";
import * as postApi from "./api";

export const postKeys = {
  detail: (id: number) => ["post", id] as const,
  comments: (id: number) => ["comments", id] as const,
  replies: (commentId: number) => ["replies", commentId] as const,
  allReplies: ["replies"] as const,
};

export function usePost(id: number, enabled = true) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postApi.getPost(id),
    enabled,
  });
}

export function useComments(postId: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: postKeys.comments(postId),
    queryFn: ({ pageParam }) => postApi.getComments(postId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.length < postApi.COMMENTS_PAGE_SIZE ? undefined : all.length + 1,
    enabled,
  });
}

export function useReplies(commentId: number, enabled: boolean) {
  return useQuery({
    queryKey: postKeys.replies(commentId),
    queryFn: () => postApi.getReplies(commentId),
    enabled,
  });
}

export function useAddPostComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: number }) =>
      postApi.addComment(postId, text, parentId),
    onSuccess: (_created, { parentId }) => {
      void qc.invalidateQueries({ queryKey: postKeys.comments(postId) });
      if (parentId) {
        void qc.invalidateQueries({ queryKey: postKeys.replies(parentId) });
      }
      void qc.invalidateQueries({ queryKey: postKeys.detail(postId) });
      void qc.invalidateQueries({ queryKey: feedKeys.feed });
    },
  });
}

export function useDeleteComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postApi.deleteComment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: postKeys.comments(postId) });
      void qc.invalidateQueries({ queryKey: postKeys.allReplies });
      void qc.invalidateQueries({ queryKey: postKeys.detail(postId) });
      void qc.invalidateQueries({ queryKey: feedKeys.feed });
    },
  });
}

export function usePostLike(postId: number) {
  const qc = useQueryClient();
  const key = postKeys.detail(postId);
  return useMutation({
    mutationFn: () => likePost(postId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<PostDto>(key);
      qc.setQueryData<PostDto>(key, (old) =>
        old
          ? {
              ...old,
              postLike: !old.postLike,
              postLikeCount: old.postLikeCount + (old.postLike ? -1 : 1),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: feedKeys.feed });
    },
  });
}

export function usePostFavorite(postId: number) {
  const qc = useQueryClient();
  const key = postKeys.detail(postId);
  return useMutation({
    mutationFn: () => favoritePost(postId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<PostDto>(key);
      qc.setQueryData<PostDto>(key, (old) =>
        old ? { ...old, postFavorite: !old.postFavorite } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: feedKeys.feed });
    },
  });
}