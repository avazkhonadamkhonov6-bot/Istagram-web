import {
  commentDtoSchema,
  postDtoSchema,
  type CommentDto,
  type PostDto,
} from "@repo/shared";
import { api } from "@/lib/api-client";

export const COMMENTS_PAGE_SIZE = 10;

export const getPost = (id: number) =>
  api<PostDto>(`/Post/get-post-by-id?id=${id}`, { schema: postDtoSchema });

export const getComments = (postId: number, page: number) =>
  api<CommentDto[]>(
    `/Post/get-comments?postId=${postId}&PageNumber=${page}&PageSize=${COMMENTS_PAGE_SIZE}`,
    { schema: commentDtoSchema.array() },
  );

export const getReplies = (commentId: number) =>
  api<CommentDto[]>(`/Post/get-comment-replies?commentId=${commentId}`, {
    schema: commentDtoSchema.array(),
  });

export const addComment = (postId: number, comment: string, parentId?: number) =>
  api<CommentDto>("/Post/add-comment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ postId, comment, ...(parentId ? { parentId } : {}) }),
    schema: commentDtoSchema,
  });

export const deleteComment = (commentId: number) =>
  api<boolean>(`/Post/delete-comment?commentId=${commentId}`, {
    method: "DELETE",
  });