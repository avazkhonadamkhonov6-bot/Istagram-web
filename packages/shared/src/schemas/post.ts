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
  /** Spec 14 §2 */
  Location: z.string().trim().max(100).optional(),
  /** JSON: [{ userName, x, y, imageIndex }] */
  Tags: z.string().max(5000).optional(),
});

export const postTagInputSchema = z.object({
  userName: z.string().trim().toLowerCase().min(1).max(30),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  imageIndex: z.number().int().min(0).max(9).default(0),
});
export const postTagsInputSchema = z.array(postTagInputSchema).max(20);
export type PostTagInput = z.infer<typeof postTagInputSchema>;

export const updatePostSchema = z
  .object({
    postId: z.number().int().positive(),
    content: z.string().trim().max(2200).nullable().optional(),
    location: z.string().trim().max(100).nullable().optional(),
    hideLikeCount: z.boolean().optional(),
    commentsDisabled: z.boolean().optional(),
  })
  .strict();
export type UpdatePostDto = z.infer<typeof updatePostSchema>;

export const userPostsQuerySchema = paginationQuerySchema.extend({ UserId: z.string().uuid() });
export const locationPostsQuerySchema = paginationQuerySchema.extend({ Name: z.string().trim().min(1).max(100) });

/** Collections (Spec 14 §2) */
export const collectionDtoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  postsCount: z.number().int(),
  cover: z.string().nullable(),
});
export type CollectionDto = z.infer<typeof collectionDtoSchema>;
export const addCollectionSchema = z.object({ name: z.string().trim().min(1).max(50) }).strict();
export const updateCollectionSchema = z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(50) }).strict();
export const collectionItemSchema = z.object({ collectionId: z.number().int().positive(), postId: z.number().int().positive() }).strict();
export const collectionItemQuerySchema = z.object({
  collectionId: z.coerce.number().int().positive(),
  postId: z.coerce.number().int().positive(),
});
export const collectionPostsQuerySchema = paginationQuerySchema.extend({ collectionId: z.coerce.number().int().positive() });

export const PIN_LIMIT = 3;
/** @username dar matn (Spec 14 §2) */
export const MENTION_REGEX = /(?:^|[^\w.])@([a-z0-9._]{1,30})/giu;

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
  /** Spec 14 §2 */
  isLiked: z.boolean().default(false),
  likeCount: z.number().int().default(0),
  isRestricted: z.boolean().default(false),
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
  /** Spec 14 §2 */
  location: z.string().nullable().default(null),
  tags: z
    .array(z.object({ userId: z.string(), userName: z.string(), x: z.number(), y: z.number(), imageIndex: z.number().int() }))
    .default([]),
  hideLikeCount: z.boolean().default(false),
  commentsDisabled: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  isPinned: z.boolean().default(false),
});
export type PostDto = z.infer<typeof postDtoSchema>;

export const likeResultSchema = z.object({ isLiked: z.boolean(), likeCount: z.number().int() });
export const viewResultSchema = z.object({ viewCount: z.number().int() });
export const favoriteResultSchema = z.object({ isFavorite: z.boolean() });
export const toggleResultSchema = z.object({ value: z.boolean() });

/** Regex-i hashtag (Spec 04) */
export const HASHTAG_REGEX = /#([\p{L}\p{N}_]{1,100})/gu;
