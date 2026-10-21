import { z } from 'zod';
import { paginationQuerySchema, userShortSchema } from './common';

export const getPostsQuerySchema = paginationQuerySchema.extend({
  UserId: z.string().uuid().optional(),
  Title: z.string().trim().max(200).optional(),
  Content: z.string().trim().max(200).optional(),
});

export const followingPostsQuerySchema = paginationQuerySchema.extend({
  UserId: z.string().uuid().optional(),
});

export const postIdQuerySchema = z.object({ postId: z.coerce.number().int().positive() });
export const commentIdQuerySchema = z.object({ commentId: z.coerce.number().int().positive() });

/** Maydonhoi matnii multipart-i add-post (faylho — `Images`) */
export const addPostBodySchema = z.object({
  Title: z.string().trim().max(200).optional(),
  Content: z.string().trim().max(2200).optional(),
});

export const addCommentSchema = z
  .object({
    comment: z.string().trim().min(1).max(2200),
    postId: z.number().int().positive(),
    /** Javob ba comment (Spec 13 §3) */
    parentId: z.number().int().positive().nullable().optional(),
  })
  .strict();

export const getCommentsQuerySchema = paginationQuerySchema.extend({ postId: z.coerce.number().int().positive() });

export const hashtagSearchQuerySchema = z.object({
  Query: z.string().trim().min(1).max(100).transform((v) => v.replace(/^#/, '').toLowerCase()),
});
export const hashtagPostsQuerySchema = paginationQuerySchema.extend({
  Name: z.string().trim().min(1).max(100).transform((v) => v.replace(/^#/, '').toLowerCase()),
});
export const hashtagDtoSchema = z.object({ name: z.string(), postsCount: z.number().int() });
export type HashtagDto = z.infer<typeof hashtagDtoSchema>;
export type AddCommentDto = z.infer<typeof addCommentSchema>;

export const addPostFavoriteSchema = z.object({ postId: z.number().int().positive() }).strict();

export const commentDtoSchema = z.object({
  postCommentId: z.number().int(),
  postId: z.number().int(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string().nullable(),
  comment: z.string(),
  dateCommented: z.string(),
  parentId: z.number().int().nullable(),
  replyCount: z.number().int(),
});
export type CommentDto = z.infer<typeof commentDtoSchema>;

export const postDtoSchema = z.object({
  postId: z.number().int(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string().nullable(),
  title: z.string().nullable(),
  content: z.string().nullable(),
  images: z.array(z.string()),
  isReel: z.boolean(),
  datePublished: z.string(),
  postLike: z.boolean(),
  postLikeCount: z.number().int(),
  postView: z.number().int(),
  commentCount: z.number().int(),
  postFavorite: z.boolean(),
  comments: z.array(commentDtoSchema),
  userLikes: z.array(userShortSchema),
});
export type PostDto = z.infer<typeof postDtoSchema>;

export const likeResultSchema = z.object({ isLiked: z.boolean(), likeCount: z.number().int() });
export const viewResultSchema = z.object({ viewCount: z.number().int() });
export const favoriteResultSchema = z.object({ isFavorite: z.boolean() });

/** Regex-i hashtag (Spec 04) */
export const HASHTAG_REGEX = /#([\p{L}\p{N}_]{1,100})/gu;
