"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import type { CommentDto, PostDto } from "@repo/shared";
import * as feedApi from "./api";

export const feedKeys = {
  feed: ["feed"] as const,
  suggestions: ["suggestions"] as const,
};

type FeedData = InfiniteData<PostDto[], number>;

function patchPost(
  qc: QueryClient,
  postId: number,
  patch: (p: PostDto) => PostDto,
) {
  qc.setQueryData<FeedData>(feedKeys.feed, (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((page) =>
            page.map((p) => (p.postId === postId ? patch(p) : p)),
          ),
        }
      : old,
  );
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: feedKeys.feed,
    queryFn: ({ pageParam }) => feedApi.getFeedPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.length < feedApi.FEED_PAGE_SIZE ? undefined : all.length + 1,
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (post: PostDto) => feedApi.likePost(post.postId),
    onMutate: async (post) => {
      await qc.cancelQueries({ queryKey: feedKeys.feed });
      const snapshot = qc.getQueryData<FeedData>(feedKeys.feed);
      patchPost(qc, post.postId, (p) => ({
        ...p,
        postLike: !p.postLike,
        postLikeCount: p.postLikeCount + (p.postLike ? -1 : 1),
      }));
      return { snapshot };
    },
    onError: (_err, _post, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(feedKeys.feed, ctx.snapshot);
    },
    onSuccess: (res, post) =>
      patchPost(qc, post.postId, (p) => ({
        ...p,
        postLike: res.isLiked,
        postLikeCount: res.likeCount,
      })),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (post: PostDto) => feedApi.favoritePost(post.postId),
    onMutate: async (post) => {
      await qc.cancelQueries({ queryKey: feedKeys.feed });
      const snapshot = qc.getQueryData<FeedData>(feedKeys.feed);
      patchPost(qc, post.postId, (p) => ({
        ...p,
        postFavorite: !p.postFavorite,
      }));
      return { snapshot };
    },
    onError: (_err, _post, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(feedKeys.feed, ctx.snapshot);
    },
    onSuccess: (res, post) =>
      patchPost(qc, post.postId, (p) => ({
        ...p,
        postFavorite: res.isFavorite,
      })),
  });
}

export function useAddComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => feedApi.addComment(postId, text),
    onSuccess: (created: CommentDto) =>
      patchPost(qc, postId, (p) => ({
        ...p,
        commentCount: p.commentCount + 1,
        comments: [...p.comments, created],
      })),
  });
}

export function useSuggestions() {
  return useQuery({
    queryKey: feedKeys.suggestions,
    queryFn: feedApi.getSuggestions,
    staleTime: 5 * 60_000,
  });
}

export function useFollow() {
  return useMutation({ mutationFn: feedApi.followUser });
}