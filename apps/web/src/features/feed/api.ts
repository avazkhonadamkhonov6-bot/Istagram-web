import {
  commentDtoSchema,
  favoriteResultSchema,
  likeResultSchema,
  postDtoSchema,
  userListItemSchema,
  type CommentDto,
  type PostDto,
  type UserListItem,
} from "@repo/shared";
import { api } from "@/lib/api-client";

export const FEED_PAGE_SIZE = 10;
const JSON_HEADERS = { "content-type": "application/json" };

export const getFeedPage = (page: number) =>
  api<PostDto[]>(
    `/Post/get-following-post?PageNumber=${page}&PageSize=${FEED_PAGE_SIZE}`,
    { schema: postDtoSchema.array() },
  );

export const likePost = (postId: number) =>
  api<{ isLiked: boolean; likeCount: number }>(
    `/Post/like-post?postId=${postId}`,
    { method: "POST", schema: likeResultSchema },
  );

export const favoritePost = (postId: number) =>
  api<{ isFavorite: boolean }>("/Post/add-post-favorite", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ postId }),
    schema: favoriteResultSchema,
  });

export const addComment = (postId: number, comment: string) =>
  api<CommentDto>("/Post/add-comment", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ postId, comment }),
    schema: commentDtoSchema,
  });

export const getSuggestions = () =>
  api<UserListItem[]>("/User/get-suggestions", {
    schema: userListItemSchema.array(),
  });

export const followUser = (userId: string) =>
  api<boolean>(
    `/FollowingRelationShip/add-following-relation-ship?followingUserId=${userId}`,
    { method: "POST" },
  );